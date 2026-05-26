import React, { useState, useEffect } from 'react';
import useIdeStore from '../store/ideStore.js';

const LANG_LABELS = {
  javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python',
  rust: 'Rust', go: 'Go', java: 'Java', c: 'C', cpp: 'C++',
  csharp: 'C#', php: 'PHP', ruby: 'Ruby', swift: 'Swift', kotlin: 'Kotlin',
  html: 'HTML', css: 'CSS', scss: 'SCSS', json: 'JSON', yaml: 'YAML',
  markdown: 'Markdown', shell: 'Shell', powershell: 'PowerShell',
  sql: 'SQL', xml: 'XML', plaintext: 'Plain Text',
};

export default function StatusBar() {
  const {
    ollamaOnline, selectedModel, openFiles, activeFilePath, setSettingsOpen,
  } = useIdeStore();

  const [cursorPos] = useState({ line: 1, col: 1 });

  const activeFile = openFiles.find(f => f.path === activeFilePath);
  const language = activeFile?.language || null;
  const langLabel = language ? (LANG_LABELS[language] || language) : null;

  // Ping Ollama every 12 seconds
  useEffect(() => {
    const checkOllama = async () => {
      try {
        const running = await window.api.ollama.checkRunning();
        useIdeStore.getState().setOllamaOnline(running);
      } catch {}
    };
    checkOllama();
    const interval = setInterval(checkOllama, 12000);
    return () => clearInterval(interval);
  }, []);

  const shortModel = selectedModel.split(':')[0];

  return (
    <div style={{
      height: 'var(--statusbar-h)',
      background: 'linear-gradient(90deg, #0a0c16, #0d1020)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 8,
      paddingRight: 8,
      flexShrink: 0,
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-3)',
      position: 'relative',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Git branch */}
        <StatusItem title="Git Branch">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="3" x2="6" y2="15"/>
            <circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
            <path d="M18 9a9 9 0 0 1-9 9"/>
          </svg>
          <span style={{ color: 'var(--text-2)' }}>main</span>
        </StatusItem>

        {/* Cursor pos */}
        {activeFile && (
          <StatusItem>
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          </StatusItem>
        )}

        {/* Unsaved */}
        {activeFile?.isDirty && (
          <StatusItem>
            <span style={{ color: 'var(--accent2)', animation: 'blink 2s ease-in-out infinite' }}>●</span>
            <span style={{ color: 'var(--accent2)' }}>Unsaved</span>
          </StatusItem>
        )}
      </div>

      {/* Center — file path */}
      {activeFilePath && (
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'var(--text-4)',
          fontSize: 10,
          letterSpacing: '0.02em',
        }}>
          {activeFilePath}
        </div>
      )}

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Language */}
        {langLabel && (
          <StatusItem>
            <span style={{ color: 'var(--text-2)' }}>{langLabel}</span>
          </StatusItem>
        )}

        {/* Encoding */}
        <StatusItem>
          <span>UTF-8</span>
        </StatusItem>

        {/* Ollama / Model badge */}
        <button
          onClick={() => setSettingsOpen(true)}
          title="AI Model Settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 9px',
            borderRadius: 5,
            background: ollamaOnline ? 'var(--green-dim)' : 'var(--red-dim)',
            border: `1px solid ${ollamaOnline ? 'var(--green)33' : 'var(--red)33'}`,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            outline: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <div className={`status-dot ${ollamaOnline ? 'online' : 'offline'}`} style={{ width: 6, height: 6 }} />
          <span style={{
            color: ollamaOnline ? 'var(--green)' : 'var(--red)',
            fontWeight: 600,
            fontSize: 10,
          }}>
            {ollamaOnline ? shortModel : 'Ollama offline'}
          </span>
        </button>
      </div>
    </div>
  );
}

function StatusItem({ children, title }) {
  return (
    <div
      title={title}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 3px' }}
    >
      {children}
    </div>
  );
}
