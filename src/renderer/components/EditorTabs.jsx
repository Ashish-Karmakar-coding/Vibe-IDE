import React, { useRef, useEffect } from 'react';
import useIdeStore from '../store/ideStore.js';

export default function EditorTabs() {
  const {
    openFiles,
    activeFilePath,
    setActiveFile,
    closeFile,
    markFileClean,
  } = useIdeStore();

  const tabsRef = useRef(null);

  // Scroll active tab into view
  useEffect(() => {
    if (!tabsRef.current || !activeFilePath) return;
    const activeTab = tabsRef.current.querySelector('[data-active="true"]');
    activeTab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeFilePath]);

  const handleClose = async (e, file) => {
    e.stopPropagation();
    if (file.isDirty) {
      const shouldSave = confirm(`Save changes to "${file.path.split(/[\\/]/).pop()}"?`);
      if (shouldSave) {
        await window.api.fs.writeFile(file.path, file.content);
        markFileClean(file.path);
      }
    }
    closeFile(file.path);
  };

  if (openFiles.length === 0) {
    return (
      <div style={{
        height: 'var(--tab-h)',
        background: 'var(--bg-editor)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 16,
        flexShrink: 0,
      }}>
        <WelcomeTab />
      </div>
    );
  }

  return (
    <div
      ref={tabsRef}
      style={{
        height: 'var(--tab-h)',
        background: 'var(--bg-editor)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-end',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        scrollbarWidth: 'none',
      }}
    >
      {openFiles.map(file => {
        const name = file.path.split(/[\\/]/).pop();
        const isActive = file.path === activeFilePath;

        return (
          <div
            key={file.path}
            data-active={isActive}
            onClick={() => setActiveFile(file.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              height: '100%',
              cursor: 'pointer',
              fontSize: 12,
              color: isActive ? 'var(--text-1)' : 'var(--text-3)',
              background: isActive ? 'var(--bg-editor)' : 'var(--bg-panel)',
              borderRight: '1px solid var(--border)',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 100ms ease',
              whiteSpace: 'nowrap',
              minWidth: 0,
              flexShrink: 0,
              fontFamily: 'var(--font-mono)',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-2)';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-panel)';
                e.currentTarget.style.color = 'var(--text-3)';
              }
            }}
          >
            {/* Dirty indicator */}
            {file.isDirty && (
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent2)',
                flexShrink: 0,
              }} />
            )}

            {/* File name */}
            <span style={{
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {name}
            </span>

            {/* Close button */}
            <button
              onClick={(e) => handleClose(e, file)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-3)',
                fontSize: 14,
                lineHeight: 1,
                padding: '0 2px',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                opacity: 0,
                transition: 'opacity 100ms ease, color 100ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--red)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-3)';
              }}
              className="tab-close-btn"
            >
              ×
            </button>
          </div>
        );
      })}

      {/* Show close button on hover via CSS */}
      <style>{`
        [data-active="true"] .tab-close-btn,
        [data-active="false"]:hover .tab-close-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

function WelcomeTab() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: 'var(--text-3)',
      fontSize: 12,
    }}>
      <span style={{ fontSize: 16 }}>👋</span>
      <span>Open a file to start editing</span>
      <span style={{ color: 'var(--text-4)', fontSize: 11 }}>— Ctrl+B to toggle explorer</span>
    </div>
  );
}
