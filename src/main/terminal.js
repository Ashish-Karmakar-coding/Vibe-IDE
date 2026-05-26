const os = require('os');
const path = require('path');

// Map of terminal id → pty process
const terminals = new Map();
let terminalCounter = 0;
let ptyModule = null;
let ptyAvailable = null;

// Lazy load node-pty only when first terminal is created
function getPty() {
  if (ptyAvailable !== null) return ptyAvailable ? ptyModule : null;

  try {
    ptyModule = require('node-pty');
    ptyAvailable = true;
    return ptyModule;
  } catch (e) {
    console.warn('[Terminal] node-pty not available:', e.message);
    ptyAvailable = false;
    return null;
  }
}

function getDefaultShell() {
  if (process.platform === 'win32') {
    // Try PowerShell Core first, fall back to Windows PowerShell, then cmd
    const ps7 = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe';
    const psWin = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    const fs = require('fs');
    if (fs.existsSync(ps7)) return ps7;
    if (fs.existsSync(psWin)) return psWin;
    return process.env.ComSpec || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

function setupTerminalHandlers(ipcMain, mainWindow) {
  // Create a new terminal instance
  ipcMain.handle('terminal:create', async (_, options = {}) => {
    const pty = getPty();

    if (!pty) {
      return {
        success: false,
        error: 'node-pty is not available. Visual Studio Build Tools are required to compile it on Windows. Run: npm install --global windows-build-tools'
      };
    }

    const id = ++terminalCounter;
    const shell = getDefaultShell();
    const cwd = options.cwd || os.homedir();

    try {
      const term = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: options.cols || 80,
        rows: options.rows || 24,
        cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        },
        // Disable ConPTY fallback that causes the console list agent crash
        useConpty: false,
      });

      term.onData(data => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal:data', id, data);
        }
      });

      term.onExit(({ exitCode }) => {
        terminals.delete(id);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal:exit', id, exitCode);
        }
      });

      terminals.set(id, term);
      return { success: true, id };
    } catch (err) {
      console.error('[Terminal] Spawn error:', err.message);
      return { success: false, error: err.message };
    }
  });

  // Send input to a terminal
  ipcMain.handle('terminal:input', async (_, id, data) => {
    const term = terminals.get(id);
    if (term) {
      try { term.write(data); } catch {}
    }
  });

  // Resize terminal
  ipcMain.handle('terminal:resize', async (_, id, cols, rows) => {
    const term = terminals.get(id);
    if (term && cols > 0 && rows > 0) {
      try {
        term.resize(Math.floor(cols), Math.floor(rows));
      } catch {}
    }
  });

  // Close a terminal
  ipcMain.handle('terminal:close', async (_, id) => {
    const term = terminals.get(id);
    if (term) {
      try { term.kill(); } catch {}
      terminals.delete(id);
    }
    return { success: true };
  });

  // Cleanup all terminals on window close
  mainWindow.on('closed', () => {
    for (const [, term] of terminals) {
      try { term.kill(); } catch {}
    }
    terminals.clear();
  });
}

module.exports = { setupTerminalHandlers };
