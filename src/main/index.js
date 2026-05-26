const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { setupFileSystemHandlers } = require('./fileSystem');
const { setupTerminalHandlers } = require('./terminal');
const { setupOllamaHandlers } = require('./ollama');
const { setupSettingsHandlers, getSettings } = require('./settings');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const settings = getSettings();
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0b0f',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode (comment out for cleaner UI)
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// Register all IPC handlers
function registerHandlers(win) {
  setupFileSystemHandlers(ipcMain, win);
  setupTerminalHandlers(ipcMain, win);
  setupOllamaHandlers(ipcMain, win);
  setupSettingsHandlers(ipcMain);
}

// Window control IPC handlers
function registerWindowHandlers() {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

  // Open external links in the system browser
  ipcMain.handle('shell:openExternal', (_, url) => shell.openExternal(url));
}

app.whenReady().then(() => {
  const win = createWindow();
  registerHandlers(win);
  registerWindowHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5173' && !isDev) {
      event.preventDefault();
    }
  });
});
