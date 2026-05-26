// electron-store must be imported as ESM-style in CommonJS context
let Store;
try {
  // electron-store v8 ships as ESM; we need dynamic import
  Store = null; // will be loaded async
} catch {}

let store = null;

const DEFAULTS = {
  selectedModel: 'codellama',
  theme: 'dark',
  fontSize: 14,
  terminalFontSize: 13,
  openFolderPath: '',
  wordWrap: true,
  minimapEnabled: true,
  autoSave: true,
};

// Async init because electron-store v8 is ESM
async function initStore() {
  if (store) return store;
  const { default: ElectronStore } = await import('electron-store');
  store = new ElectronStore({
    name: 'novacoder-settings',
    defaults: DEFAULTS,
  });
  return store;
}

function getSettings() {
  // Synchronous fallback — returns defaults before store is ready
  if (!store) return { ...DEFAULTS };
  return store.store;
}

function setupSettingsHandlers(ipcMain) {
  // Ensure store is initialized
  initStore().catch(console.error);

  ipcMain.handle('settings:get', async (_, key) => {
    const s = await initStore();
    return s.get(key, DEFAULTS[key]);
  });

  ipcMain.handle('settings:set', async (_, key, value) => {
    const s = await initStore();
    s.set(key, value);
    return { success: true };
  });

  ipcMain.handle('settings:getAll', async () => {
    const s = await initStore();
    return s.store;
  });

  ipcMain.handle('settings:reset', async () => {
    const s = await initStore();
    s.store = { ...DEFAULTS };
    return { success: true };
  });
}

module.exports = { setupSettingsHandlers, getSettings, initStore, DEFAULTS };
