import { create } from 'zustand';

// ─── Language detection from extension ────────────────────────
const EXT_LANG_MAP = {
  '.js':    'javascript',
  '.jsx':   'javascript',
  '.ts':    'typescript',
  '.tsx':   'typescript',
  '.py':    'python',
  '.rs':    'rust',
  '.go':    'go',
  '.java':  'java',
  '.c':     'c',
  '.cpp':   'cpp',
  '.cc':    'cpp',
  '.h':     'cpp',
  '.cs':    'csharp',
  '.php':   'php',
  '.rb':    'ruby',
  '.swift': 'swift',
  '.kt':    'kotlin',
  '.html':  'html',
  '.htm':   'html',
  '.css':   'css',
  '.scss':  'scss',
  '.sass':  'scss',
  '.less':  'less',
  '.json':  'json',
  '.jsonc': 'json',
  '.yaml':  'yaml',
  '.yml':   'yaml',
  '.toml':  'toml',
  '.md':    'markdown',
  '.mdx':   'markdown',
  '.sh':    'shell',
  '.bash':  'shell',
  '.zsh':   'shell',
  '.fish':  'shell',
  '.ps1':   'powershell',
  '.sql':   'sql',
  '.xml':   'xml',
  '.svg':   'xml',
  '.vue':   'html',
  '.tf':    'hcl',
  '.dockerfile': 'dockerfile',
  '':       'plaintext',
};

function getLanguage(filePath) {
  if (!filePath) return 'plaintext';
  const parts = filePath.split('.');
  const ext = parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
  const basename = filePath.split(/[\\/]/).pop().toLowerCase();
  if (basename === 'dockerfile') return 'dockerfile';
  if (basename === 'makefile') return 'makefile';
  return EXT_LANG_MAP[ext] || 'plaintext';
}

// ─── Zustand Store ────────────────────────────────────────────
const useIdeStore = create((set, get) => ({
  // ── File System State ──────────────────────────────────────
  fileTree: [],
  rootFolder: null,   // { path, name }
  openFiles: [],      // [{ path, content, language, isDirty }]
  activeFilePath: null,

  // ── Chat State ──────────────────────────────────────────────
  messages: [],
  isAiThinking: false,
  streamingContent: '', // Current streaming AI message

  // ── AI / Model State ────────────────────────────────────────
  selectedModel: 'codellama',
  availableModels: [],
  ollamaOnline: false,

  // ── UI State ────────────────────────────────────────────────
  terminalVisible: true,
  sidebarVisible: true,
  chatVisible: true,
  settingsOpen: false,
  activePanel: 'files', // 'files' | 'search' | 'git'

  // ── Settings ─────────────────────────────────────────────────
  theme: 'dark',
  fontSize: 14,
  terminalFontSize: 13,
  wordWrap: true,
  minimapEnabled: true,
  autoSave: true,

  // ─── File Actions ────────────────────────────────────────────
  setFileTree: (fileTree) => set({ fileTree }),
  setRootFolder: (rootFolder) => set({ rootFolder }),

  openFile: (path, content) => {
    const { openFiles } = get();
    const existing = openFiles.find(f => f.path === path);
    if (existing) {
      set({ activeFilePath: path });
      return;
    }
    const newFile = {
      path,
      content: content ?? '',
      language: getLanguage(path),
      isDirty: false,
    };
    set({
      openFiles: [...openFiles, newFile],
      activeFilePath: path,
    });
  },

  closeFile: (path) => {
    const { openFiles, activeFilePath } = get();
    const idx = openFiles.findIndex(f => f.path === path);
    const newFiles = openFiles.filter(f => f.path !== path);

    let newActive = activeFilePath;
    if (activeFilePath === path) {
      if (newFiles.length === 0) {
        newActive = null;
      } else if (idx > 0) {
        newActive = newFiles[idx - 1].path;
      } else {
        newActive = newFiles[0].path;
      }
    }

    set({ openFiles: newFiles, activeFilePath: newActive });
  },

  setActiveFile: (path) => set({ activeFilePath: path }),

  updateFileContent: (path, content) => {
    set(state => ({
      openFiles: state.openFiles.map(f =>
        f.path === path ? { ...f, content, isDirty: true } : f
      ),
    }));
  },

  markFileClean: (path) => {
    set(state => ({
      openFiles: state.openFiles.map(f =>
        f.path === path ? { ...f, isDirty: false } : f
      ),
    }));
  },

  setFileContentFromDisk: (path, content) => {
    set(state => ({
      openFiles: state.openFiles.map(f =>
        f.path === path ? { ...f, content, isDirty: false } : f
      ),
    }));
  },

  getActiveFile: () => {
    const { openFiles, activeFilePath } = get();
    return openFiles.find(f => f.path === activeFilePath) || null;
  },

  // ─── Chat Actions ────────────────────────────────────────────
  addMessage: (role, content) => {
    const message = {
      id: Date.now() + Math.random(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    set(state => ({ messages: [...state.messages, message] }));
    return message.id;
  },

  updateLastAssistantMessage: (content) => {
    set(state => {
      const messages = [...state.messages];
      const lastIdx = messages.length - 1;
      if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
        messages[lastIdx] = { ...messages[lastIdx], content };
      }
      return { messages };
    });
  },

  setStreamingContent: (content) => set({ streamingContent: content }),
  setThinking: (val) => set({ isAiThinking: val }),

  clearMessages: () => set({ messages: [] }),

  // ─── Model Actions ────────────────────────────────────────────
  setModels: (models) => set({ availableModels: models }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setOllamaOnline: (online) => set({ ollamaOnline: online }),

  // ─── UI Actions ───────────────────────────────────────────────
  toggleTerminal: () => set(s => ({ terminalVisible: !s.terminalVisible })),
  toggleSidebar: () => set(s => ({ sidebarVisible: !s.sidebarVisible })),
  toggleChat: () => set(s => ({ chatVisible: !s.chatVisible })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel }),

  // ─── Settings Actions ─────────────────────────────────────────
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.classList.toggle('light', theme === 'light');
  },
  setFontSize: (size) => set({ fontSize: size }),
  setTerminalFontSize: (size) => set({ terminalFontSize: size }),
  setWordWrap: (wrap) => set({ wordWrap: wrap }),
  setMinimapEnabled: (enabled) => set({ minimapEnabled: enabled }),
  setAutoSave: (autoSave) => set({ autoSave }),

  applySettings: (settings) => {
    if (settings.selectedModel) set({ selectedModel: settings.selectedModel });
    if (settings.theme) {
      set({ theme: settings.theme });
      document.documentElement.classList.toggle('light', settings.theme === 'light');
    }
    if (settings.fontSize) set({ fontSize: settings.fontSize });
    if (settings.terminalFontSize) set({ terminalFontSize: settings.terminalFontSize });
    if (settings.wordWrap !== undefined) set({ wordWrap: settings.wordWrap });
    if (settings.minimapEnabled !== undefined) set({ minimapEnabled: settings.minimapEnabled });
    if (settings.autoSave !== undefined) set({ autoSave: settings.autoSave });
  },
}));

export { getLanguage };
export default useIdeStore;
