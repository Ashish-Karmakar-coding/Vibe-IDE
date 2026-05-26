const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

let activeWatcher = null;

// ─── Build recursive file tree ──────────────────────────────────────────────
function buildFileTree(dirPath, depth = 0) {
  if (depth > 10) return []; // Safety limit

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  // Sort: folders first, then files, both alphabetically
  const sorted = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  // Filter out common junk directories
  const ignored = new Set([
    'node_modules', '.git', '.DS_Store', 'dist', 'build',
    '__pycache__', '.next', '.nuxt', 'coverage', '.cache',
    '.vite', 'out', '.turbo',
  ]);

  return sorted
    .filter(entry => !ignored.has(entry.name) && !entry.name.startsWith('.'))
    .map(entry => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: fullPath,
          type: 'folder',
          children: buildFileTree(fullPath, depth + 1),
          expanded: depth === 0, // Auto-expand root level
        };
      }
      return {
        name: entry.name,
        path: fullPath,
        type: 'file',
        extension: path.extname(entry.name).toLowerCase(),
      };
    });
}

// ─── IPC Handlers Setup ──────────────────────────────────────────────────────
function setupFileSystemHandlers(ipcMain, mainWindow) {
  // Open folder dialog → returns file tree
  ipcMain.handle('fs:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Open Project Folder',
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const folderPath = result.filePaths[0];
    const tree = buildFileTree(folderPath);

    return {
      path: folderPath,
      name: path.basename(folderPath),
      tree,
    };
  });

  // Read file content
  ipcMain.handle('fs:readFile', async (_, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Write file content
  ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Create new file
  ipcMain.handle('fs:createFile', async (_, folderPath, name) => {
    try {
      const filePath = path.join(folderPath, name);
      if (fs.existsSync(filePath)) {
        return { success: false, error: 'File already exists' };
      }
      fs.writeFileSync(filePath, '', 'utf-8');
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Create new folder
  ipcMain.handle('fs:createFolder', async (_, parentPath, name) => {
    try {
      const folderPath = path.join(parentPath, name);
      if (fs.existsSync(folderPath)) {
        return { success: false, error: 'Folder already exists' };
      }
      fs.mkdirSync(folderPath, { recursive: true });
      return { success: true, path: folderPath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Delete file or folder
  ipcMain.handle('fs:deleteItem', async (_, itemPath) => {
    try {
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Rename file or folder
  ipcMain.handle('fs:renameItem', async (_, oldPath, newName) => {
    try {
      const dir = path.dirname(oldPath);
      const newPath = path.join(dir, newName);
      if (fs.existsSync(newPath)) {
        return { success: false, error: 'An item with that name already exists' };
      }
      fs.renameSync(oldPath, newPath);
      return { success: true, newPath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Refresh/get tree for an already-opened folder
  ipcMain.handle('fs:getTree', async (_, folderPath) => {
    try {
      const tree = buildFileTree(folderPath);
      return {
        success: true,
        path: folderPath,
        name: path.basename(folderPath),
        tree,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Watch folder for changes
  ipcMain.handle('fs:watchFolder', async (_, folderPath) => {
    if (activeWatcher) {
      await activeWatcher.close();
      activeWatcher = null;
    }

    activeWatcher = chokidar.watch(folderPath, {
      ignored: /(node_modules|\.git|dist|build|__pycache__|\.next)/,
      persistent: true,
      ignoreInitial: true,
      depth: 10,
    });

    const sendEvent = (eventType, itemPath) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('fs:fileChanged', {
          type: eventType,
          path: itemPath,
          name: path.basename(itemPath),
        });
      }
    };

    activeWatcher
      .on('add', p => sendEvent('add', p))
      .on('change', p => sendEvent('change', p))
      .on('unlink', p => sendEvent('unlink', p))
      .on('addDir', p => sendEvent('addDir', p))
      .on('unlinkDir', p => sendEvent('unlinkDir', p));

    return { success: true };
  });

  // Stop watching
  ipcMain.handle('fs:unwatchFolder', async () => {
    if (activeWatcher) {
      await activeWatcher.close();
      activeWatcher = null;
    }
    return { success: true };
  });
}

module.exports = { setupFileSystemHandlers, buildFileTree };
