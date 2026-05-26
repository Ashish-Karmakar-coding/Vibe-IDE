import React, { useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import useIdeStore from '../store/ideStore.js';

// Debounce helper
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Welcome screen when no file is open
function WelcomeScreen() {
  const shortcuts = [
    ['Ctrl+B', 'Toggle Explorer'],
    ['Ctrl+`', 'Toggle Terminal'],
    ['Ctrl+J', 'Toggle AI Chat'],
    ['Ctrl+S', 'Save File'],
    ['Ctrl+,', 'Settings'],
  ];

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-editor)',
      gap: 28,
      padding: 32,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 76,
          height: 76,
          borderRadius: 22,
          background: 'var(--grad-glow)',
          border: '1px solid var(--border-bright)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 40px var(--accent-dim), 0 8px 32px rgba(0,0,0,0.5)',
          animation: 'pulse-accent 4s ease-in-out infinite',
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'var(--grad-main)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 6,
          }}>
            LumaIDE
          </div>
          <div style={{ color: 'var(--text-3)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AI-Powered · Local LLM · Ollama
          </div>
        </div>
      </div>

      {/* Shortcuts grid */}
      <div style={{ maxWidth: 380, width: '100%' }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-4)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: 10,
        }}>
          Keyboard Shortcuts
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {shortcuts.map(([key, label]) => (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 14px',
              background: 'var(--bg-panel)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              transition: 'border-color 150ms ease',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <kbd style={{
                background: 'var(--bg-active)',
                border: '1px solid var(--border-bright)',
                borderRadius: 5,
                padding: '2px 7px',
                fontSize: 10,
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}>
                {key}
              </kbd>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 20,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7a2 2 0 0 1 2-2h3.586a1 1 0 0 1 .707.293L10.707 6.7A1 1 0 0 0 11.414 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
        </svg>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          Open a folder from the Explorer to start coding
        </span>
      </div>
    </div>
  );
}

export default function MonacoEditor() {
  const {
    openFiles,
    activeFilePath,
    theme,
    fontSize,
    wordWrap,
    minimapEnabled,
    autoSave,
    updateFileContent,
    markFileClean,
  } = useIdeStore();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  // Map of filePath → monaco model
  const modelsRef = useRef({});

  const activeFile = openFiles.find(f => f.path === activeFilePath);

  // Auto-save debounced
  const debouncedAutoSave = useCallback(
    debounce(async (path, content) => {
      if (!autoSave) return;
      const result = await window.api.fs.writeFile(path, content);
      if (result.success) markFileClean(path);
    }, 1000),
    [autoSave, markFileClean]
  );

  // When editor mounts
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add extra keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      const file = useIdeStore.getState().getActiveFile();
      if (file) {
        await window.api.fs.writeFile(file.path, file.content);
        useIdeStore.getState().markFileClean(file.path);
      }
    });
  };

  // When content changes in editor
  const handleChange = (value) => {
    if (!activeFilePath || value === undefined) return;
    updateFileContent(activeFilePath, value);
    debouncedAutoSave(activeFilePath, value);
  };

  // Sync editor content when active file changes externally (e.g. AI applied code)
  useEffect(() => {
    if (!editorRef.current || !activeFile) return;
    const currentValue = editorRef.current.getValue();
    if (currentValue !== activeFile.content) {
      editorRef.current.setValue(activeFile.content);
    }
  }, [activeFile?.content]);

  // Update editor options when settings change
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.updateOptions({
      fontSize,
      wordWrap: wordWrap ? 'on' : 'off',
      minimap: { enabled: minimapEnabled },
    });
  }, [fontSize, wordWrap, minimapEnabled]);

  if (!activeFile) {
    return <WelcomeScreen />;
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <Editor
        key={activeFilePath}
        language={activeFile.language}
        value={activeFile.content}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize,
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
          fontLigatures: true,
          minimap: { enabled: minimapEnabled },
          wordWrap: wordWrap ? 'on' : 'off',
          formatOnPaste: true,
          formatOnType: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderLineHighlight: 'gutter',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          tabSize: 2,
          insertSpaces: true,
          trimAutoWhitespace: true,
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          padding: { top: 12, bottom: 12 },
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            preview: true,
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showModules: true,
            showKeywords: true,
          },
        }}
        loading={
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-editor)',
            color: 'var(--text-3)',
            fontSize: 13,
          }}>
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
