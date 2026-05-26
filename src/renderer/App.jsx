import React, { useEffect, useCallback, useRef } from 'react';
import useIdeStore from './store/ideStore.js';
import TitleBar from './components/TitleBar.jsx';
import ActivityBar from './components/ActivityBar.jsx';
import FileExplorer from './components/FileExplorer.jsx';
import EditorTabs from './components/EditorTabs.jsx';
import MonacoEditor from './components/MonacoEditor.jsx';
import Terminal from './components/Terminal.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import StatusBar from './components/StatusBar.jsx';
import SettingsModal from './components/SettingsModal.jsx';

export default function App() {
  const {
    sidebarVisible,
    chatVisible,
    terminalVisible,
    settingsOpen,
    theme,
    activeFilePath,
    openFiles,
    applySettings,
    setModels,
    setOllamaOnline,
    setSelectedModel,
    toggleTerminal,
    toggleSidebar,
    toggleChat,
    markFileClean,
    setSettingsOpen,
  } = useIdeStore();

  const hasInitialized = useRef(false);

  // ─── On mount: load settings, check Ollama, restore last folder ─────────
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function init() {
      try {
        // Load persisted settings
        const settings = await window.api.settings.getAll();
        if (settings) {
          applySettings(settings);
          if (settings.selectedModel) setSelectedModel(settings.selectedModel);
        }

        // Check Ollama status
        const isRunning = await window.api.ollama.checkRunning();
        setOllamaOnline(isRunning);

        if (isRunning) {
          const models = await window.api.ollama.listModels();
          setModels(models);
        }
      } catch (err) {
        console.error('Init error:', err);
      }
    }

    init();
  }, []);

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────
  const handleKeyDown = useCallback(async (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    if (!isCtrl) return;

    switch (e.key) {
      case 's': {
        e.preventDefault();
        if (!activeFilePath) return;
        const file = openFiles.find(f => f.path === activeFilePath);
        if (file?.isDirty) {
          await window.api.fs.writeFile(activeFilePath, file.content);
          markFileClean(activeFilePath);
        }
        break;
      }
      case '`': {
        e.preventDefault();
        toggleTerminal();
        break;
      }
      case 'b': {
        e.preventDefault();
        toggleSidebar();
        break;
      }
      case 'j': {
        e.preventDefault();
        toggleChat();
        break;
      }
      case ',': {
        e.preventDefault();
        setSettingsOpen(true);
        break;
      }
    }
  }, [activeFilePath, openFiles, toggleTerminal, toggleSidebar, toggleChat, markFileClean, setSettingsOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ─── Layout ──────────────────────────────────────────────────────────────
  const gridColumns = [
    'var(--activitybar-w)',
    sidebarVisible ? 'var(--sidebar-w)' : '0px',
    '1fr',
    chatVisible ? 'var(--chat-w)' : '0px',
  ].join(' ');

  return (
    <div
      className={theme === 'light' ? 'light' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-base)',
        overflow: 'hidden',
      }}
    >
      {/* Title Bar */}
      <TitleBar />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: gridColumns,
          gridTemplateRows: terminalVisible
            ? `1fr var(--terminal-h)`
            : '1fr 0px',
          overflow: 'hidden',
          transition: 'grid-template-columns 200ms ease, grid-template-rows 200ms ease',
        }}
      >
        {/* Activity Bar — spans full height including terminal */}
        <div
          style={{
            gridColumn: '1',
            gridRow: '1 / 3',
            background: 'var(--bg-panel)',
            borderRight: '1px solid var(--border)',
            zIndex: 10,
          }}
        >
          <ActivityBar />
        </div>

        {/* Sidebar — File Explorer */}
        <div
          style={{
            gridColumn: '2',
            gridRow: '1',
            overflow: 'hidden',
            background: 'var(--bg-panel)',
            borderRight: '1px solid var(--border)',
            display: sidebarVisible ? 'flex' : 'none',
            flexDirection: 'column',
          }}
        >
          <FileExplorer />
        </div>

        {/* Editor Area */}
        <div
          style={{
            gridColumn: '3',
            gridRow: '1',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--bg-editor)',
          }}
        >
          <EditorTabs />
          <MonacoEditor />
        </div>

        {/* Chat Panel */}
        <div
          style={{
            gridColumn: '4',
            gridRow: '1',
            overflow: 'hidden',
            display: chatVisible ? 'flex' : 'none',
            flexDirection: 'column',
            background: 'var(--bg-panel)',
            borderLeft: '1px solid var(--border)',
          }}
        >
          <ChatPanel />
        </div>

        {/* Terminal — spans columns 2-4 */}
        <div
          style={{
            gridColumn: '2 / 5',
            gridRow: '2',
            overflow: 'hidden',
            display: terminalVisible ? 'flex' : 'none',
            flexDirection: 'column',
            background: 'var(--bg-panel)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <Terminal />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Settings Modal */}
      {settingsOpen && <SettingsModal />}
    </div>
  );
}
