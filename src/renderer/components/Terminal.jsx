import React, { useEffect, useRef, useState, useCallback } from 'react';
import useIdeStore from '../store/ideStore.js';

// Dynamic import xterm to avoid SSR issues
let Terminal_xterm, FitAddon, WebLinksAddon;

async function loadXterm() {
  const [xtermMod, fitMod, linksMod] = await Promise.all([
    import('@xterm/xterm'),
    import('@xterm/addon-fit'),
    import('@xterm/addon-web-links'),
  ]);
  Terminal_xterm = xtermMod.Terminal;
  FitAddon = fitMod.FitAddon;
  WebLinksAddon = linksMod.WebLinksAddon;
}

let xtermLoaded = false;
let loadPromise = null;

function ensureXterm() {
  if (!loadPromise) loadPromise = loadXterm().then(() => { xtermLoaded = true; });
  return loadPromise;
}

function TerminalInstance({ id, isActive, theme, terminalFontSize }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const cleanupRef = useRef(null);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await ensureXterm();
      if (!mounted || !containerRef.current) return;

      const term = new Terminal_xterm({
        theme: theme === 'dark' ? {
          background: '#0a0b0f',
          foreground: '#e2e8f0',
          cursor: '#5b7fff',
          cursorAccent: '#0a0b0f',
          selectionBackground: '#5b7fff33',
          black: '#1e2130',
          red: '#f87171',
          green: '#34d399',
          yellow: '#fbbf24',
          blue: '#5b7fff',
          magenta: '#a78bfa',
          cyan: '#22d3ee',
          white: '#e2e8f0',
          brightBlack: '#374151',
          brightRed: '#f87171',
          brightGreen: '#34d399',
          brightYellow: '#fde68a',
          brightBlue: '#6b8fff',
          brightMagenta: '#c4b5fd',
          brightCyan: '#67e8f9',
          brightWhite: '#f1f5f9',
        } : {
          background: '#fafbff',
          foreground: '#1a1f2e',
          cursor: '#5b7fff',
          selectionBackground: '#5b7fff33',
        },
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        fontSize: terminalFontSize,
        lineHeight: 1.4,
        cursorBlink: true,
        cursorStyle: 'bar',
        allowTransparency: true,
        scrollback: 5000,
        rightClickSelectsWord: true,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      term.open(containerRef.current);
      fitAddon.fit();

      termRef.current = term;
      fitAddonRef.current = fitAddon;

      // Create PTY
      const result = await window.api.terminal.create({
        cwd: undefined,
        cols: term.cols,
        rows: term.rows,
      });

      if (!result.success) {
        term.writeln('\r\n\x1b[31m⚠ Terminal error: ' + (result.error || 'node-pty not available') + '\x1b[0m');
        term.writeln('\x1b[33mRun: npm run rebuild\x1b[0m\r\n');
        return;
      }

      // Confirm the actual terminal ID matches
      const termId = result.id;

      // Data from PTY → xterm
      const removeDataListener = window.api.terminal.onData((incomingId, data) => {
        if (incomingId === termId && termRef.current) {
          termRef.current.write(data);
        }
      });

      // User input → PTY
      term.onData(data => {
        window.api.terminal.sendInput(termId, data);
      });

      // Resize
      resizeObserverRef.current = new ResizeObserver(() => {
        if (!fitAddonRef.current || !termRef.current) return;
        try {
          fitAddonRef.current.fit();
          window.api.terminal.resize(termId, termRef.current.cols, termRef.current.rows);
        } catch {}
      });

      if (containerRef.current) {
        resizeObserverRef.current.observe(containerRef.current);
      }

      cleanupRef.current = () => {
        removeDataListener();
        resizeObserverRef.current?.disconnect();
        window.api.terminal.close(termId);
        term.dispose();
      };
    };

    init();

    return () => {
      mounted = false;
      cleanupRef.current?.();
    };
  }, []);

  // Theme update
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.fontSize = terminalFontSize;
      fitAddonRef.current?.fit();
    }
  }, [terminalFontSize]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        display: isActive ? 'block' : 'none',
        padding: '4px 0',
      }}
    />
  );
}

export default function Terminal() {
  const { theme, terminalFontSize, toggleTerminal } = useIdeStore();
  const [tabs, setTabs] = useState([{ id: 1, name: 'bash' }]);
  const [activeTab, setActiveTab] = useState(1);
  const tabCounter = useRef(2);

  const addTab = () => {
    const id = tabCounter.current++;
    setTabs(prev => [...prev, { id, name: 'bash' }]);
    setActiveTab(id);
  };

  const closeTab = (id) => {
    const remaining = tabs.filter(t => t.id !== id);
    if (remaining.length === 0) {
      toggleTerminal();
      return;
    }
    setTabs(remaining);
    if (activeTab === id) {
      setActiveTab(remaining[remaining.length - 1].id);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Terminal Tab Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 32,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        flexShrink: 0,
        paddingLeft: 4,
        gap: 2,
      }}>
        {/* Label */}
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-3)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '0 8px',
          borderRight: '1px solid var(--border)',
          marginRight: 4,
        }}>
          Terminal
        </span>

        {/* Tabs */}
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 10px',
              height: '100%',
              cursor: 'pointer',
              fontSize: 11,
              color: activeTab === tab.id ? 'var(--text-1)' : 'var(--text-3)',
              background: activeTab === tab.id ? 'var(--bg-active)' : 'transparent',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              transition: 'all 100ms ease',
            }}
          >
            <span>⚡ {tab.name}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add Tab Button */}
        <button
          onClick={addTab}
          title="New Terminal"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-3)',
            cursor: 'pointer',
            fontSize: 16,
            padding: '0 6px',
            lineHeight: 1,
            transition: 'color 100ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          +
        </button>

        {/* Right: Close terminal panel */}
        <div style={{ marginLeft: 'auto', paddingRight: 6 }}>
          <button
            onClick={toggleTerminal}
            title="Close Terminal Panel (Ctrl+`)"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-3)',
              cursor: 'pointer',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 4,
              lineHeight: 1,
              transition: 'all 100ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-3)';
            }}
          >
            ∨
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        background: theme === 'dark' ? '#0a0b0f' : '#fafbff',
      }}>
        {tabs.map(tab => (
          <TerminalInstance
            key={tab.id}
            id={tab.id}
            isActive={tab.id === activeTab}
            theme={theme}
            terminalFontSize={terminalFontSize}
          />
        ))}
      </div>
    </div>
  );
}
