import React, { useState, useEffect } from 'react';
import useIdeStore from '../store/ideStore.js';

export default function TitleBar() {
  const { activeFilePath, theme, openFiles, ollamaOnline, selectedModel } = useIdeStore();
  const [isMaximized, setIsMaximized] = useState(false);

  const activeFile = openFiles.find(f => f.path === activeFilePath);
  const fileName = activeFilePath ? activeFilePath.split(/[\\\/]/).pop() : null;

  useEffect(() => {
    const checkMaximized = async () => {
      const result = await window.api.window.isMaximized();
      setIsMaximized(result);
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => window.api.window.minimize();
  const handleMaximize = async () => {
    await window.api.window.maximize();
    const result = await window.api.window.isMaximized();
    setIsMaximized(result);
  };
  const handleClose = () => window.api.window.close();

  return (
    <div
      className="drag-region"
      style={{
        height: 'var(--titlebar-h)',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Logo + Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 6,
        minWidth: 'calc(var(--activitybar-w))',
      }}>
        {/* Luma icon */}
        <div style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: 'var(--grad-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px var(--accent-glow)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.04em',
          background: 'var(--grad-main)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          LumaIDE
        </span>
      </div>

      {/* Center — File name + AI model badge */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        pointerEvents: 'none',
      }}>
        {fileName ? (
          <span style={{
            fontSize: 12,
            color: activeFile?.isDirty ? 'var(--accent2)' : 'var(--text-2)',
            fontFamily: 'var(--font-mono)',
            maxWidth: 320,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 200ms ease',
          }}>
            {activeFile?.isDirty ? '● ' : ''}{fileName}
          </span>
        ) : (
          <span style={{
            fontSize: 11,
            color: 'var(--text-4)',
            fontFamily: 'var(--font-mono)',
          }}>
            No file open
          </span>
        )}

        {/* Model badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 9px',
          borderRadius: 20,
          background: ollamaOnline ? 'var(--accent-dim)' : 'var(--bg-active)',
          border: `1px solid ${ollamaOnline ? 'var(--accent)33' : 'var(--border)'}`,
          pointerEvents: 'none',
        }}>
          <div className={`status-dot ${ollamaOnline ? 'online' : 'offline'}`} style={{ width: 5, height: 5 }} />
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: ollamaOnline ? 'var(--accent)' : 'var(--text-3)',
            fontWeight: 600,
            letterSpacing: '0.03em',
          }}>
            {ollamaOnline ? selectedModel : 'offline'}
          </span>
        </div>
      </div>

      {/* Window Controls */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 7, paddingRight: 2 }}>
        <WinBtn
          color="#fbbf24"
          hoverColor="#f59e0b"
          onClick={handleMinimize}
          title="Minimize"
          symbol="−"
        />
        <WinBtn
          color={isMaximized ? '#34d399' : '#4a5580'}
          hoverColor="#34d399"
          onClick={handleMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
          symbol={isMaximized ? '❐' : '□'}
        />
        <WinBtn
          color="#f87171"
          hoverColor="#ef4444"
          onClick={handleClose}
          title="Close"
          symbol="×"
        />
      </div>
    </div>
  );
}

function WinBtn({ color, hoverColor, onClick, title, symbol }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      className="no-drag"
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 13,
        height: 13,
        borderRadius: '50%',
        background: hovered ? hoverColor : color,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        color: 'rgba(0,0,0,0.7)',
        fontWeight: 900,
        transition: 'background 150ms ease, transform 100ms ease, box-shadow 150ms ease',
        transform: hovered ? 'scale(1.15)' : 'scale(1)',
        outline: 'none',
        boxShadow: hovered ? `0 0 6px ${hoverColor}80` : 'none',
      }}
    >
      {hovered ? symbol : null}
    </button>
  );
}
