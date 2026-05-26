const { contextBridge, ipcRenderer } = require('electron');

// ─── Helper: create event listener with cleanup function ──────────────────────
function createListener(channel, callback) {
  const handler = (_, ...args) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

// ─── Expose safe API to renderer ──────────────────────────────────────────────
contextBridge.exposeInMainWorld('api', {
  // ── File System ──────────────────────────────────────────────────────────────
  fs: {
    openFolder: () => ipcRenderer.invoke('fs:openFolder'),
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    createFile: (folderPath, name) => ipcRenderer.invoke('fs:createFile', folderPath, name),
    createFolder: (parentPath, name) => ipcRenderer.invoke('fs:createFolder', parentPath, name),
    deleteItem: (itemPath) => ipcRenderer.invoke('fs:deleteItem', itemPath),
    renameItem: (oldPath, newName) => ipcRenderer.invoke('fs:renameItem', oldPath, newName),
    getTree: (folderPath) => ipcRenderer.invoke('fs:getTree', folderPath),
    watchFolder: (folderPath) => ipcRenderer.invoke('fs:watchFolder', folderPath),
    unwatchFolder: () => ipcRenderer.invoke('fs:unwatchFolder'),
    // Returns a cleanup function to remove listener
    onFileChange: (callback) => createListener('fs:fileChanged', callback),
  },

  // ── Terminal ──────────────────────────────────────────────────────────────────
  terminal: {
    create: (options) => ipcRenderer.invoke('terminal:create', options),
    sendInput: (id, data) => ipcRenderer.invoke('terminal:input', id, data),
    resize: (id, cols, rows) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
    close: (id) => ipcRenderer.invoke('terminal:close', id),
    onData: (callback) => createListener('terminal:data', callback),
    onExit: (callback) => createListener('terminal:exit', callback),
  },

  // ── Ollama AI ─────────────────────────────────────────────────────────────────
  ollama: {
    chat: (model, messages) => ipcRenderer.invoke('ollama:chat', model, messages),
    listModels: () => ipcRenderer.invoke('ollama:listModels'),
    checkRunning: () => ipcRenderer.invoke('ollama:checkRunning'),
    onChunk: (callback) => createListener('ollama:chunk', callback),
    onDone: (callback) => createListener('ollama:done', callback),
    onError: (callback) => createListener('ollama:error', callback),
  },

  // ── Settings ──────────────────────────────────────────────────────────────────
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },

  // ── Window Controls ───────────────────────────────────────────────────────────
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // ── Shell ─────────────────────────────────────────────────────────────────────
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  },
});
