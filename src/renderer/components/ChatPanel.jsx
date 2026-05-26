import React, { useEffect, useRef, useState, useCallback } from 'react';
import useIdeStore from '../store/ideStore.js';
import ChatMessage from './ChatMessage.jsx';

// ─── Parse <file path="...">CODE</file> from AI ──────────────
function parseFileBlocks(text) {
  const regex = /<file\s+path="([^"]+)">\s*([\s\S]*?)\s*<\/file>/g;
  const blocks = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ path: match[1], code: match[2] });
  }
  return blocks;
}

// ─── Model size tag heuristic ────────────────────────────────
function getModelTag(name) {
  const n = name.toLowerCase();
  if (n.includes('70b') || n.includes('72b')) return '70B';
  if (n.includes('34b') || n.includes('33b')) return '34B';
  if (n.includes('13b')) return '13B';
  if (n.includes('8b'))  return '8B';
  if (n.includes('7b'))  return '7B';
  if (n.includes('3b'))  return '3B';
  if (n.includes('1b'))  return '1B';
  return null;
}

function getModelIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('llama'))   return '🦙';
  if (n.includes('mistral')) return '🌪️';
  if (n.includes('gemma'))   return '💎';
  if (n.includes('phi'))     return '🔭';
  if (n.includes('qwen'))    return '🌸';
  if (n.includes('codellama') || n.includes('code')) return '💻';
  if (n.includes('deepseek')) return '🔍';
  if (n.includes('starcoder')) return '⭐';
  return '🤖';
}

// ─── Model Picker Dropdown ───────────────────────────────────
function ModelPicker({ models, selectedModel, onSelect, ollamaOnline, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const shortName = selectedModel.split(':')[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="no-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 20,
          border: `1px solid ${ollamaOnline ? 'var(--accent)44' : 'var(--border)'}`,
          background: ollamaOnline ? 'var(--accent-dim)' : 'var(--bg-active)',
          color: ollamaOnline ? 'var(--accent)' : 'var(--text-3)',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          transition: 'all 150ms ease',
          outline: 'none',
          letterSpacing: '0.02em',
        }}
        title="Select AI Model"
      >
        <span style={{ fontSize: 12 }}>{getModelIcon(selectedModel)}</span>
        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shortName}
        </span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms ease', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          minWidth: 280,
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-bright)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 5000,
          animation: 'slideIn 0.15s ease-out',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px 8px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Ollama Models
            </span>
            <button
              onClick={handleRefresh}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: 'var(--text-2)',
                transition: 'color 100ms ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
            >
              {refreshing ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '↺'} Refresh
            </button>
          </div>

          {/* Ollama offline message */}
          {!ollamaOnline && (
            <div style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>⚡</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>Ollama is not running</div>
              <code style={{ fontSize: 11, background: 'var(--bg-active)', padding: '2px 8px', borderRadius: 4, color: 'var(--accent2)' }}>
                ollama serve
              </code>
            </div>
          )}

          {/* Model List */}
          {ollamaOnline && models.length === 0 && (
            <div style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>No models installed</div>
              <code style={{ fontSize: 11, background: 'var(--bg-active)', padding: '2px 8px', borderRadius: 4, color: 'var(--accent2)' }}>
                ollama pull codellama
              </code>
            </div>
          )}

          {ollamaOnline && models.map(model => {
            const isActive = model === selectedModel;
            const tag = getModelTag(model);
            const icon = getModelIcon(model);
            const shortN = model.split(':')[0];
            return (
              <div
                key={model}
                onClick={() => { onSelect(model); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 14px',
                  cursor: 'pointer',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 100ms ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: isActive ? 'var(--accent)' : 'var(--text-1)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {shortN}
                  </div>
                  {model.includes(':') && (
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {model.split(':')[1]}
                    </div>
                  )}
                </div>
                {tag && (
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: 8,
                    background: isActive ? 'var(--accent)22' : 'var(--bg-active)',
                    border: `1px solid ${isActive ? 'var(--accent)44' : 'var(--border)'}`,
                    color: isActive ? 'var(--accent)' : 'var(--text-3)',
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0,
                  }}>
                    {tag}
                  </span>
                )}
                {isActive && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            );
          })}

          {/* Pull hint */}
          {ollamaOnline && (
            <div style={{
              padding: '8px 14px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-3)',
              fontSize: 10,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
              </svg>
              <span>Run <code style={{ color: 'var(--accent2)', background: 'var(--bg-active)', padding: '0 4px', borderRadius: 3 }}>ollama pull &lt;name&gt;</code> to add more</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ChatPanel ──────────────────────────────────────────
export default function ChatPanel() {
  const {
    messages,
    isAiThinking,
    selectedModel,
    availableModels,
    ollamaOnline,
    activeFilePath,
    openFiles,
    addMessage,
    updateLastAssistantMessage,
    setThinking,
    setModels,
    setOllamaOnline,
    setSelectedModel,
    setFileContentFromDisk,
  } = useIdeStore();

  const [input, setInput] = useState('');
  const [includeFile, setIncludeFile] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const streamCleanupRef = useRef([]);

  const activeFile = openFiles.find(f => f.path === activeFilePath);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  // Auto-grow textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  };

  // Refresh models
  const refreshModels = async () => {
    const running = await window.api.ollama.checkRunning();
    setOllamaOnline(running);
    if (running) {
      const models = await window.api.ollama.listModels();
      setModels(models);
    }
  };

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    window.api.settings.set('selectedModel', model);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isAiThinking || !ollamaOnline) return;

    const userText = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Build context
    let contextualMessage = userText;
    if (includeFile && activeFile) {
      contextualMessage = `Current file: ${activeFile.path}\n\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\`\n\n${userText}`;
    }

    addMessage('user', userText);

    const { messages: currentMessages } = useIdeStore.getState();
    const apiMessages = [
      ...currentMessages
        .slice(0, -1)
        .map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: contextualMessage },
    ];

    setThinking(true);
    addMessage('assistant', '');

    let fullResponse = '';

    streamCleanupRef.current.forEach(fn => fn());
    streamCleanupRef.current = [];

    const removeChunkListener = window.api.ollama.onChunk((chunk) => {
      fullResponse += chunk;
      updateLastAssistantMessage(fullResponse);
    });

    const removeDoneListener = window.api.ollama.onDone(async () => {
      setThinking(false);
      removeChunkListener();
      removeDoneListener();
      removeErrorListener();

      const fileBlocks = parseFileBlocks(fullResponse);
      for (const block of fileBlocks) {
        await window.api.fs.writeFile(block.path, block.code);
        const openFile = useIdeStore.getState().openFiles.find(f => f.path === block.path);
        if (openFile) setFileContentFromDisk(block.path, block.code);
      }
    });

    const removeErrorListener = window.api.ollama.onError((err) => {
      setThinking(false);
      updateLastAssistantMessage(`⚠️ Error: ${err}`);
      removeChunkListener();
      removeDoneListener();
      removeErrorListener();
    });

    streamCleanupRef.current = [removeChunkListener, removeDoneListener, removeErrorListener];

    try {
      await window.api.ollama.chat(selectedModel, apiMessages);
    } catch (err) {
      setThinking(false);
      updateLastAssistantMessage(`⚠️ Failed to connect to Ollama: ${err.message}`);
    }
  }, [input, isAiThinking, ollamaOnline, selectedModel, activeFile, includeFile]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: 8,
      }}>
        {/* Left: Title + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: 'var(--grad-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            boxShadow: '0 2px 8px var(--accent-glow)',
            flexShrink: 0,
          }}>
            ✦
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '0.04em' }}>
              AI Assistant
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
              LOCAL LLM · OLLAMA
            </div>
          </div>
        </div>

        {/* Right: Model picker */}
        <ModelPicker
          models={availableModels}
          selectedModel={selectedModel}
          onSelect={handleSelectModel}
          ollamaOnline={ollamaOnline}
          onRefresh={refreshModels}
        />
      </div>

      {/* Context chip */}
      {activeFile && (
        <div style={{
          padding: '5px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          background: 'var(--bg-base)',
        }}>
          <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Context</span>
          <button
            onClick={() => setIncludeFile(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 9px',
              borderRadius: 12,
              border: `1px solid ${includeFile ? 'var(--accent)44' : 'var(--border)'}`,
              background: includeFile ? 'var(--accent-dim)' : 'transparent',
              color: includeFile ? 'var(--accent)' : 'var(--text-3)',
              cursor: 'pointer',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              transition: 'all 150ms ease',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={activeFile.path}
          >
            {includeFile
              ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
            }
            {activeFile.path.split(/[\\\/]/).pop()}
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {messages.length === 0 && !isAiThinking && (
          <EmptyChat ollamaOnline={ollamaOnline} model={selectedModel} onPromptSelect={setInput} />
        )}

        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Thinking indicator */}
        {isAiThinking && messages[messages.length - 1]?.content === '' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'var(--grad-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              flexShrink: 0,
              boxShadow: '0 2px 8px var(--accent-glow)',
            }}>
              ✦
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Ollama offline banner */}
      {!ollamaOnline && (
        <div style={{
          margin: '0 10px 8px',
          padding: '9px 12px',
          background: 'var(--red-dim)',
          border: '1px solid var(--red)33',
          borderRadius: 10,
          fontSize: 11,
          color: 'var(--red)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}>
          <span>⚠️</span>
          <span>
            Ollama is offline — run{' '}
            <code style={{ background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: 4 }}>ollama serve</code>
          </span>
        </div>
      )}

      {/* Input Area */}
      <div style={{ padding: '8px 10px 12px', flexShrink: 0 }}>
        <div style={{
          background: 'var(--bg-active)',
          borderRadius: 12,
          border: '1px solid var(--border-bright)',
          overflow: 'hidden',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = 'var(--accent)55';
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-dim)';
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = 'var(--border-bright)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={ollamaOnline
              ? `Ask ${selectedModel.split(':')[0]}... (Enter to send)`
              : 'Ollama is offline — run: ollama serve'
            }
            disabled={!ollamaOnline || isAiThinking}
            rows={1}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-1)',
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              resize: 'none',
              width: '100%',
              lineHeight: 1.6,
              maxHeight: 180,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              padding: '10px 12px 4px',
            }}
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 10px 8px',
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {isAiThinking ? (
                <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="spinner" style={{ width: 10, height: 10 }} />
                  Generating...
                </span>
              ) : (
                '⏎ send  ⇧⏎ newline'
              )}
            </span>

            <button
              onClick={sendMessage}
              disabled={!input.trim() || isAiThinking || !ollamaOnline}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 14px',
                borderRadius: 8,
                border: 'none',
                background: input.trim() && !isAiThinking && ollamaOnline
                  ? 'var(--accent)'
                  : 'var(--bg-hover)',
                color: input.trim() && !isAiThinking && ollamaOnline
                  ? '#fff'
                  : 'var(--text-3)',
                cursor: input.trim() && !isAiThinking && ollamaOnline ? 'pointer' : 'not-allowed',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 150ms ease',
                boxShadow: input.trim() && !isAiThinking && ollamaOnline
                  ? '0 2px 8px var(--accent-glow)'
                  : 'none',
              }}
            >
              {isAiThinking ? (
                <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span className="thinking-dot" style={{ width: 4, height: 4 }} />
                  <span className="thinking-dot" style={{ width: 4, height: 4 }} />
                  <span className="thinking-dot" style={{ width: 4, height: 4 }} />
                </span>
              ) : (
                <>
                  Send
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
function EmptyChat({ ollamaOnline, model, onPromptSelect }) {
  const prompts = [
    { text: 'Explain this code', icon: '🔍' },
    { text: 'Fix the bugs', icon: '🐛' },
    { text: 'Add error handling', icon: '🛡️' },
    { text: 'Write unit tests', icon: '🧪' },
    { text: 'Optimize performance', icon: '⚡' },
    { text: 'Add TypeScript types', icon: '📝' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px',
      gap: 16,
    }}>
      {/* Logo */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: 'var(--grad-glow)',
        border: '1px solid var(--border-bright)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        boxShadow: '0 0 30px var(--accent-dim)',
      }}>
        ✦
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text-1)',
          marginBottom: 5,
        }}>
          {ollamaOnline ? `${model.split(':')[0]}` : 'Ollama Offline'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
          {ollamaOnline
            ? 'Open a file and ask me anything about your code'
            : 'Start Ollama to enable AI assistance'}
        </div>
      </div>

      {ollamaOnline && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 300 }}>
          {prompts.map(({ text, icon }) => (
            <button
              key={text}
              onClick={() => onPromptSelect && onPromptSelect(text)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 20,
                border: '1px solid var(--border-bright)',
                background: 'var(--bg-active)',
                color: 'var(--text-2)',
                cursor: 'pointer',
                fontSize: 11,
                transition: 'all 150ms ease',
                fontFamily: 'var(--font-ui)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
                e.currentTarget.style.background = 'var(--accent-dim)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-bright)';
                e.currentTarget.style.color = 'var(--text-2)';
                e.currentTarget.style.background = 'var(--bg-active)';
              }}
            >
              <span>{icon}</span> {text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
