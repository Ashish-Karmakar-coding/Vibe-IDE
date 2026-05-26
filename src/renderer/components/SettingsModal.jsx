import React, { useState, useEffect } from 'react';
import useIdeStore from '../store/ideStore.js';

const SECTIONS = ['AI Model', 'Editor', 'Terminal', 'Theme', 'About'];

export default function SettingsModal() {
  const {
    setSettingsOpen,
    selectedModel,
    availableModels,
    ollamaOnline,
    theme,
    fontSize,
    terminalFontSize,
    wordWrap,
    minimapEnabled,
    autoSave,
    setTheme,
    setFontSize,
    setTerminalFontSize,
    setWordWrap,
    setMinimapEnabled,
    setAutoSave,
    setSelectedModel,
    setModels,
    setOllamaOnline,
  } = useIdeStore();

  const [activeSection, setActiveSection] = useState('AI Model');
  const [localModel, setLocalModel] = useState(selectedModel);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [localTermFontSize, setLocalTermFontSize] = useState(terminalFontSize);
  const [localWordWrap, setLocalWordWrap] = useState(wordWrap);
  const [localMinimap, setLocalMinimap] = useState(minimapEnabled);
  const [localAutoSave, setLocalAutoSave] = useState(autoSave);
  const [localTheme, setLocalTheme] = useState(theme);
  const [appVersion] = useState('1.0.0');

  const handleSave = async () => {
    // Apply all settings
    setSelectedModel(localModel);
    setFontSize(localFontSize);
    setTerminalFontSize(localTermFontSize);
    setWordWrap(localWordWrap);
    setMinimapEnabled(localMinimap);
    setAutoSave(localAutoSave);
    setTheme(localTheme);

    // Persist to disk
    await Promise.all([
      window.api.settings.set('selectedModel', localModel),
      window.api.settings.set('fontSize', localFontSize),
      window.api.settings.set('terminalFontSize', localTermFontSize),
      window.api.settings.set('wordWrap', localWordWrap),
      window.api.settings.set('minimapEnabled', localMinimap),
      window.api.settings.set('autoSave', localAutoSave),
      window.api.settings.set('theme', localTheme),
    ]);

    setSettingsOpen(false);
  };

  const handleRefreshModels = async () => {
    const running = await window.api.ollama.checkRunning();
    setOllamaOnline(running);
    if (running) {
      const models = await window.api.ollama.listModels();
      setModels(models);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ width: 680, height: 480, display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontSize: 15,
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Settings
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              LumaIDE
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-3)',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: '2px 6px',
              borderRadius: 6,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--red-dim)';
              e.currentTarget.style.color = 'var(--red)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-3)';
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{
            width: 160,
            borderRight: '1px solid var(--border)',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            flexShrink: 0,
          }}>
            {SECTIONS.map(section => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: 7,
                  border: 'none',
                  background: activeSection === section ? 'var(--bg-active)' : 'transparent',
                  color: activeSection === section ? 'var(--accent)' : 'var(--text-2)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: activeSection === section ? 600 : 400,
                  transition: 'all 150ms ease',
                  textAlign: 'left',
                }}
              >
                {section}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {activeSection === 'AI Model' && (
              <Section title="AI Model">
                <SettingRow label="Active Model" description="Select which Ollama model to use for AI chat">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select
                      className="nova-select"
                      value={localModel}
                      onChange={e => setLocalModel(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      {availableModels.length === 0
                        ? <option value={localModel}>{localModel}</option>
                        : availableModels.map(m => <option key={m} value={m}>{m}</option>)
                      }
                    </select>
                    <button
                      className="nova-btn nova-btn-ghost"
                      onClick={handleRefreshModels}
                      style={{ padding: '5px 12px', fontSize: 12 }}
                    >
                      ↺ Refresh
                    </button>
                  </div>
                </SettingRow>

                <SettingRow label="Ollama Status" description="Manage your Ollama installation">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className={`status-dot ${ollamaOnline ? 'online' : 'offline'}`} />
                    <span style={{ fontSize: 12, color: ollamaOnline ? 'var(--green)' : 'var(--red)' }}>
                      {ollamaOnline ? 'Running on localhost:11434' : 'Offline — run `ollama serve`'}
                    </span>
                  </div>
                </SettingRow>

                {ollamaOnline && (
                  <SettingRow label="Available Models" description="Click a model to set it as active">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {availableModels.map(m => (
                        <button key={m}
                          onClick={() => setLocalModel(m)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '5px 12px', borderRadius: 20,
                            border: `1px solid ${m === localModel ? 'var(--accent)' : 'var(--border-bright)'}`,
                            background: m === localModel ? 'var(--accent-dim)' : 'var(--bg-active)',
                            color: m === localModel ? 'var(--accent)' : 'var(--text-2)',
                            fontSize: 11, cursor: 'pointer',
                            fontFamily: 'var(--font-mono)', fontWeight: 600,
                            transition: 'all 150ms ease',
                          }}
                        >
                          {m === localModel && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                          {m}
                        </button>
                      ))}
                    </div>
                  </SettingRow>
                )}

                <SettingRow label="Pull a Model" description="Install a new model with ollama pull">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <code style={{
                      flex: 1, padding: '7px 12px', background: 'var(--bg-base)',
                      border: '1px solid var(--border-bright)', borderRadius: 8,
                      color: 'var(--accent2)', fontSize: 12, fontFamily: 'var(--font-mono)',
                    }}>
                      ollama pull codellama
                    </code>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>
                    Run the command above in your terminal to install a new model.
                    Try: <code style={{ color: 'var(--accent2)' }}>llama3</code>,{' '}
                    <code style={{ color: 'var(--accent2)' }}>mistral</code>,{' '}
                    <code style={{ color: 'var(--accent2)' }}>deepseek-coder</code>
                  </div>
                </SettingRow>
              </Section>
            )}

            {activeSection === 'Editor' && (
              <Section title="Editor">
                <SettingRow label="Font Size" description={`Current: ${localFontSize}px`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="range"
                      min={10}
                      max={24}
                      value={localFontSize}
                      onChange={e => setLocalFontSize(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--accent)' }}
                    />
                    <span style={{ width: 30, textAlign: 'center', fontSize: 12, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                      {localFontSize}
                    </span>
                  </div>
                </SettingRow>

                <SettingRow label="Word Wrap" description="Wrap long lines in the editor">
                  <Toggle value={localWordWrap} onChange={setLocalWordWrap} />
                </SettingRow>

                <SettingRow label="Minimap" description="Show code minimap on the right">
                  <Toggle value={localMinimap} onChange={setLocalMinimap} />
                </SettingRow>

                <SettingRow label="Auto Save" description="Automatically save files 1s after changes">
                  <Toggle value={localAutoSave} onChange={setLocalAutoSave} />
                </SettingRow>
              </Section>
            )}

            {activeSection === 'Terminal' && (
              <Section title="Terminal">
                <SettingRow label="Font Size" description={`Current: ${localTermFontSize}px`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="range"
                      min={10}
                      max={20}
                      value={localTermFontSize}
                      onChange={e => setLocalTermFontSize(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--accent)' }}
                    />
                    <span style={{ width: 30, textAlign: 'center', fontSize: 12, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                      {localTermFontSize}
                    </span>
                  </div>
                </SettingRow>
              </Section>
            )}

            {activeSection === 'Theme' && (
              <Section title="Theme">
                <SettingRow label="Color Theme" description="Switch between dark and light mode">
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['dark', 'light'].map(t => (
                      <button
                        key={t}
                        onClick={() => setLocalTheme(t)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: 8,
                          border: `2px solid ${localTheme === t ? 'var(--accent)' : 'var(--border)'}`,
                          background: t === 'dark' ? '#0a0b0f' : '#f0f2f7',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 150ms ease',
                        }}
                      >
                        <div style={{ fontSize: 20 }}>{t === 'dark' ? '🌙' : '☀️'}</div>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: t === 'dark' ? '#e2e8f0' : '#1a1f2e',
                          textTransform: 'capitalize',
                        }}>
                          {t}
                        </span>
                        {localTheme === t && (
                          <span style={{ fontSize: 10, color: 'var(--accent)' }}>Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                </SettingRow>
              </Section>
            )}

            {activeSection === 'About' && (
              <Section title="About NovaCoder">
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px 0',
                  gap: 12,
                }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#fff',
                  }}>
                    N
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      LumaIDE
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      Version {appVersion}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}>
                  {[
                    ['Electron', '29'],
                    ['React', '18'],
                    ['Monaco Editor', '0.47'],
                    ['Ollama', 'localhost:11434'],
                    ['xterm.js', '5'],
                    ['Zustand', '4'],
                  ].map(([name, version]) => (
                    <div key={name} style={{
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>v{version}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <div className={`status-dot ${ollamaOnline ? 'online' : 'offline'}`} />
                    <span style={{
                      fontSize: 11,
                      color: ollamaOnline ? 'var(--green)' : 'var(--red)',
                    }}>
                      Ollama — {ollamaOnline ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          flexShrink: 0,
        }}>
          <button
            className="nova-btn nova-btn-ghost"
            onClick={() => setSettingsOpen(false)}
          >
            Cancel
          </button>
          <button
            className="nova-btn nova-btn-primary"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 style={{
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--text-1)',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 6,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)', marginBottom: 2 }}>
            {label}
          </div>
          {description && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
              {description}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: value ? 'var(--accent)' : 'var(--bg-active)',
        border: '1px solid ' + (value ? 'var(--accent)' : 'var(--border)'),
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 200ms ease',
        outline: 'none',
      }}
    >
      <div style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        position: 'absolute',
        top: 2,
        left: value ? 20 : 2,
        transition: 'left 200ms ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}
