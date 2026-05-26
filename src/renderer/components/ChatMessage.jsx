import React, { useState, useEffect, useRef } from 'react';
import useIdeStore from '../store/ideStore.js';
import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked with highlight.js
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch {}
    }
    return hljs.highlightAuto(code).value;
  },
});

// Custom renderer to intercept code blocks
function renderMarkdown(content) {
  const renderer = new marked.Renderer();

  // We'll handle code blocks manually to inject our UI
  renderer.code = (code, language) => {
    const lang = language || 'plaintext';
    let highlighted;
    try {
      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(code, { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(code).value;
      }
    } catch {
      highlighted = code;
    }

    return `<div class="code-block-wrapper" data-code="${encodeURIComponent(code)}" data-lang="${lang}">
      <div class="code-block-header">
        <span class="code-block-lang">${lang}</span>
        <div class="code-block-actions">
          <button class="code-block-btn copy-btn" data-code="${encodeURIComponent(code)}">Copy</button>
          <button class="code-block-btn apply-btn" data-code="${encodeURIComponent(code)}">Apply to file</button>
        </div>
      </div>
      <pre class="code-block-pre"><code class="hljs language-${lang}">${highlighted}</code></pre>
    </div>`;
  };

  return marked.parse(content, { renderer });
}

export default function ChatMessage({ message }) {
  const { activeFilePath, setFileContentFromDisk } = useIdeStore();
  const containerRef = useRef(null);
  const [copyStates, setCopyStates] = useState({});
  const isUser = message.role === 'user';

  // Attach event listeners to dynamically rendered code block buttons
  useEffect(() => {
    if (!containerRef.current || isUser) return;

    const container = containerRef.current;

    const handleClick = async (e) => {
      const copyBtn = e.target.closest('.copy-btn');
      const applyBtn = e.target.closest('.apply-btn');

      if (copyBtn) {
        const code = decodeURIComponent(copyBtn.dataset.code || '');
        await navigator.clipboard.writeText(code);
        const id = copyBtn.dataset.code?.slice(0, 20);
        setCopyStates(prev => ({ ...prev, [id]: true }));
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          setCopyStates(prev => ({ ...prev, [id]: false }));
        }, 2000);
      }

      if (applyBtn) {
        const code = decodeURIComponent(applyBtn.dataset.code || '');
        if (!activeFilePath) {
          alert('No file is currently open. Open a file first.');
          return;
        }
        await window.api.fs.writeFile(activeFilePath, code);
        setFileContentFromDisk(activeFilePath, code);
        applyBtn.textContent = 'Applied!';
        applyBtn.style.borderColor = 'var(--green)';
        applyBtn.style.color = 'var(--green)';
        setTimeout(() => {
          applyBtn.textContent = 'Apply to file';
          applyBtn.style.borderColor = '';
          applyBtn.style.color = '';
        }, 2000);
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [message.content, activeFilePath]);

  const timeStr = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  if (isUser) {
    return (
      <div style={{
        padding: '6px 12px',
        animation: 'fadeIn 0.2s ease-out',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          alignItems: 'flex-end',
        }}>
          <div>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: '#fff',
              borderRadius: '12px 12px 2px 12px',
              padding: '8px 12px',
              fontSize: 12.5,
              lineHeight: 1.5,
              maxWidth: 260,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-ui)',
            }}>
              {message.content}
            </div>
            <div style={{
              fontSize: 10,
              color: 'var(--text-3)',
              textAlign: 'right',
              marginTop: 3,
            }}>
              {timeStr}
            </div>
          </div>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'var(--bg-active)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            flexShrink: 0,
            marginBottom: 18,
          }}>
            👤
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  const htmlContent = message.content ? renderMarkdown(message.content) : '';

  return (
    <div style={{
      padding: '6px 12px',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}>
        {/* AI avatar */}
        <div style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          flexShrink: 0,
          marginTop: 2,
        }}>
          🤖
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {message.content ? (
            <div
              ref={containerRef}
              className="nova-prose"
              style={{ userSelect: 'text' }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            // Streaming skeleton
            <div style={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
              padding: '6px 0',
            }}>
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </div>
          )}

          {timeStr && message.content && (
            <div style={{
              fontSize: 10,
              color: 'var(--text-3)',
              marginTop: 4,
            }}>
              {timeStr}
            </div>
          )}
        </div>
      </div>

      {/* highlight.js styles */}
      <style>{`
        .hljs { background: transparent; }
        .hljs-keyword, .hljs-selector-tag { color: #a78bfa; }
        .hljs-string, .hljs-attr { color: #34d399; }
        .hljs-number, .hljs-literal { color: #fb923c; }
        .hljs-comment { color: #475569; font-style: italic; }
        .hljs-function, .hljs-title { color: #5b7fff; }
        .hljs-variable, .hljs-name { color: #22d3ee; }
        .hljs-class { color: #fbbf24; }
        .hljs-built_in { color: #f87171; }
        .hljs-type { color: #67e8f9; }
        .hljs-operator { color: #e2e8f0; }
        .hljs-punctuation { color: #64748b; }
      `}</style>
    </div>
  );
}
