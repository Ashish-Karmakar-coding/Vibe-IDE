import React from 'react';
import useIdeStore from '../store/ideStore.js';

const PANELS = [
  {
    id: 'files',
    label: 'Explorer',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h3.586a1 1 0 0 1 .707.293L10.707 6.7A1 1 0 0 0 11.414 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    id: 'git',
    label: 'Source Control',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="18" r="3"/>
        <circle cx="6" cy="6" r="3"/>
        <circle cx="18" cy="6" r="3"/>
        <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/>
        <path d="M12 12v3"/>
      </svg>
    ),
  },
];

export default function ActivityBar() {
  const {
    activePanel,
    setActivePanel,
    sidebarVisible,
    toggleSidebar,
    chatVisible,
    toggleChat,
    ollamaOnline,
    setSettingsOpen,
  } = useIdeStore();

  const handlePanelClick = (panelId) => {
    if (activePanel === panelId && sidebarVisible) {
      toggleSidebar();
    } else {
      setActivePanel(panelId);
      if (!sidebarVisible) toggleSidebar();
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 6,
      paddingBottom: 8,
      gap: 2,
    }}>
      {/* Top — File/Search/Git panels */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, width: '100%', alignItems: 'center' }}>
        {PANELS.map(panel => (
          <ActivityButton
            key={panel.id}
            icon={panel.icon}
            label={panel.label}
            active={activePanel === panel.id && sidebarVisible}
            onClick={() => handlePanelClick(panel.id)}
          />
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '4px 0' }} />

      {/* AI Chat button — special glowing icon */}
      <div style={{ position: 'relative', marginBottom: 2 }}>
        <ActivityButton
          label="AI Chat (Ctrl+J)"
          active={chatVisible}
          onClick={toggleChat}
          icon={
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L15 22l-3-2-3 2-.3-7C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z"/>
              <circle cx="9" cy="9" r="1" fill="currentColor"/>
              <circle cx="12" cy="9" r="1" fill="currentColor"/>
              <circle cx="15" cy="9" r="1" fill="currentColor"/>
            </svg>
          }
          glowing={ollamaOnline}
        />
        {/* Online indicator */}
        {ollamaOnline && (
          <div style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 6px var(--green-glow)',
            animation: 'pulse-glow 2.5s ease-in-out infinite',
          }} />
        )}
      </div>

      {/* Divider */}
      <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '4px 0' }} />

      {/* Settings */}
      <ActivityButton
        label="Settings (Ctrl+,)"
        active={false}
        onClick={() => setSettingsOpen(true)}
        icon={
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        }
      />
    </div>
  );
}

function ActivityButton({ icon, label, active, onClick, glowing = false }) {
  return (
    <button
      onClick={onClick}
      data-tooltip={label}
      title={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active
          ? 'var(--bg-active)'
          : 'transparent',
        color: active
          ? 'var(--accent)'
          : glowing
            ? 'var(--accent2)'
            : 'var(--text-3)',
        transition: 'all 150ms ease',
        outline: 'none',
        position: 'relative',
        boxShadow: active ? 'inset 0 0 0 1px var(--border-bright)' : 'none',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-1)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = glowing ? 'var(--accent2)' : 'var(--text-3)';
        }
      }}
    >
      {/* Active indicator */}
      {active && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 3,
          height: 22,
          borderRadius: '0 4px 4px 0',
          background: 'var(--grad-main)',
          boxShadow: '0 0 8px var(--accent-glow)',
        }} />
      )}
      {icon}
    </button>
  );
}
