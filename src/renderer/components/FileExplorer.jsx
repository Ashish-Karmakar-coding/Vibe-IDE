import React, { useState, useCallback, useEffect, useRef } from 'react';
import useIdeStore from '../store/ideStore.js';

// ─── File Icons ─────────────────────────────────────────────────────────────
function FileIcon({ ext, type }) {
  if (type === 'folder') {
    return <span style={{ color: '#fbbf24', fontSize: 14 }}>📁</span>;
  }

  const icons = {
    '.js':   { symbol: '⬡', className: 'file-icon-js' },
    '.jsx':  { symbol: '⬡', className: 'file-icon-jsx' },
    '.ts':   { symbol: '⬡', className: 'file-icon-ts' },
    '.tsx':  { symbol: '⬡', className: 'file-icon-tsx' },
    '.py':   { symbol: '⬡', className: 'file-icon-py' },
    '.css':  { symbol: '◉', className: 'file-icon-css' },
    '.scss': { symbol: '◉', className: 'file-icon-css' },
    '.json': { symbol: '{}', className: 'file-icon-json' },
    '.md':   { symbol: '#',  className: 'file-icon-md' },
    '.html': { symbol: '<>', className: 'file-icon-html' },
    '.htm':  { symbol: '<>', className: 'file-icon-html' },
    '.rs':   { symbol: '⚙', className: 'file-icon-rs' },
    '.go':   { symbol: '◆', className: 'file-icon-go' },
  };

  const icon = icons[ext] || { symbol: '·', className: 'file-icon-default' };
  return (
    <span className={icon.className} style={{ fontSize: 11, fontWeight: 700, width: 16, textAlign: 'center', flexShrink: 0 }}>
      {icon.symbol}
    </span>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ x, y, node, onClose, onRefresh }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  const handleAction = async (action) => {
    onClose();
    switch (action) {
      case 'newFile': {
        const name = prompt('New file name:');
        if (!name) return;
        const targetPath = node.type === 'folder' ? node.path : node.path.split(/[\\/]/).slice(0, -1).join('/') || node.path.split(/[\\]/).slice(0, -1).join('\\');
        await window.api.fs.createFile(targetPath, name);
        onRefresh();
        break;
      }
      case 'newFolder': {
        const name = prompt('New folder name:');
        if (!name) return;
        const targetPath = node.type === 'folder' ? node.path : node.path.split(/[\\/]/).slice(0, -1).join('/');
        await window.api.fs.createFolder(targetPath, name);
        onRefresh();
        break;
      }
      case 'rename': {
        const newName = prompt('New name:', node.name);
        if (!newName || newName === node.name) return;
        await window.api.fs.renameItem(node.path, newName);
        onRefresh();
        break;
      }
      case 'delete': {
        if (confirm(`Delete "${node.name}"?`)) {
          await window.api.fs.deleteItem(node.path);
          onRefresh();
        }
        break;
      }
    }
  };

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={e => e.stopPropagation()}
    >
      <div className="context-menu-item" onClick={() => handleAction('newFile')}>
        <span>📄</span> New File
      </div>
      <div className="context-menu-item" onClick={() => handleAction('newFolder')}>
        <span>📁</span> New Folder
      </div>
      <div className="context-menu-divider" />
      <div className="context-menu-item" onClick={() => handleAction('rename')}>
        <span>✏️</span> Rename
      </div>
      <div className="context-menu-item danger" onClick={() => handleAction('delete')}>
        <span>🗑</span> Delete
      </div>
    </div>
  );
}

// ─── File Tree Node ───────────────────────────────────────────────────────────
function TreeNode({ node, depth, activeFilePath, onFileClick, onContextMenu }) {
  const [expanded, setExpanded] = useState(node.expanded ?? depth === 0);

  const paddingLeft = 12 + depth * 16;
  const isActive = node.type === 'file' && node.path === activeFilePath;

  const handleClick = () => {
    if (node.type === 'folder') {
      setExpanded(e => !e);
    } else {
      onFileClick(node);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          paddingLeft,
          paddingRight: 8,
          height: 26,
          cursor: 'pointer',
          borderRadius: 4,
          marginLeft: 4,
          marginRight: 4,
          background: isActive ? 'var(--bg-active)' : 'transparent',
          color: isActive ? 'var(--text-1)' : 'var(--text-2)',
          borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
          transition: 'all 100ms ease',
          fontSize: 12,
          userSelect: 'none',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-1)';
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-2)';
          }
        }}
      >
        {/* Expand arrow for folders */}
        {node.type === 'folder' && (
          <span style={{
            fontSize: 9,
            color: 'var(--text-3)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
            flexShrink: 0,
          }}>
            ▶
          </span>
        )}

        {/* Icon */}
        <FileIcon ext={node.extension || ''} type={node.type} />

        {/* Name */}
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {node.name}
        </span>
      </div>

      {/* Children */}
      {node.type === 'folder' && expanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFilePath={activeFilePath}
              onFileClick={onFileClick}
              onContextMenu={onContextMenu}
            />
          ))}
          {node.children.length === 0 && (
            <div style={{
              paddingLeft: paddingLeft + 20,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              fontSize: 11,
              color: 'var(--text-3)',
              fontStyle: 'italic',
            }}>
              Empty folder
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── File Explorer ─────────────────────────────────────────────────────────────
export default function FileExplorer() {
  const {
    fileTree,
    rootFolder,
    activeFilePath,
    setFileTree,
    setRootFolder,
    openFile,
  } = useIdeStore();

  const [contextMenu, setContextMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // File change watcher
  useEffect(() => {
    const cleanup = window.api.fs.onFileChange(() => {
      if (rootFolder) refreshFolder(rootFolder.path);
    });
    return cleanup;
  }, [rootFolder]);

  const refreshFolder = async (folderPath) => {
    const result = await window.api.fs.getTree(folderPath);
    if (result.success) {
      setFileTree(result.tree);
    }
  };

  const handleOpenFolder = async () => {
    setIsLoading(true);
    try {
      const result = await window.api.fs.openFolder();
      if (result) {
        setFileTree(result.tree);
        setRootFolder({ path: result.path, name: result.name });
        await window.api.fs.watchFolder(result.path);
        await window.api.settings.set('openFolderPath', result.path);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = async (node) => {
    const result = await window.api.fs.readFile(node.path);
    if (result.success) {
      openFile(node.path, result.content);
    }
  };

  const handleContextMenu = (e, node) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-3)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Explorer
        </span>
        <button
          onClick={handleOpenFolder}
          title="Open Folder"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-2)',
            padding: '2px 4px',
            borderRadius: 4,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 100ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
        >
          📂
        </button>
      </div>

      {/* Root folder name */}
      {rootFolder && (
        <div style={{
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-2)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ color: '#fbbf24' }}>📁</span>
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {rootFolder.name}
          </span>
        </div>
      )}

      {/* Tree */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingTop: 4,
        paddingBottom: 8,
      }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-3)',
            fontSize: 12,
          }}>
            Loading...
          </div>
        ) : fileTree.length === 0 ? (
          <EmptyState onOpen={handleOpenFolder} />
        ) : (
          fileTree.map(node => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              activeFilePath={activeFilePath}
              onFileClick={handleFileClick}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
          onRefresh={() => rootFolder && refreshFolder(rootFolder.path)}
        />
      )}
    </div>
  );
}

function EmptyState({ onOpen }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: 20,
      gap: 12,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 32 }}>📂</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
        No folder open
      </div>
      <button
        className="nova-btn nova-btn-primary"
        onClick={onOpen}
        style={{ fontSize: 11, padding: '6px 14px' }}
      >
        Open Folder
      </button>
    </div>
  );
}
