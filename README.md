# NovaCoder — AI-Powered Desktop IDE

> A beautiful, production-ready IDE with Monaco editor, integrated terminal, and AI chat powered by Ollama — running 100% offline.

---

## ✨ Features

- 📁 **File Explorer** — Browse, create, rename, and delete files/folders with a context menu
- 🖊️ **Monaco Editor** — VS Code's editor engine with syntax highlighting for 20+ languages
- 💬 **AI Chat** — Chat with local Ollama models (CodeLlama, Mistral, etc.) with streaming responses
- 🖥️ **Integrated Terminal** — Full PTY terminal (PowerShell / Bash) with multiple tabs
- 🎨 **Dark/Light Themes** — Polished dark theme by default, switchable to light
- ⚡ **100% Offline** — No cloud APIs. All AI runs on your machine via Ollama

---

## 🛠️ Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Comes with Node.js |
| Ollama | Latest | [ollama.ai](https://ollama.ai) |
| Git | Any | Optional, for cloning |

---

## 🚀 Setup & Run

### 1. Install Ollama
Download from [https://ollama.ai](https://ollama.ai) and follow the installer.

### 2. Pull an AI model
```bash
ollama pull codellama
# or for a smaller model:
ollama pull mistral
# or for a coding-focused model:
ollama pull deepseek-coder
```

### 3. Clone / Unzip the project
```bash
cd novacoder
```

### 4. Install dependencies
```bash
npm install
```

### 5. Rebuild native modules (required for terminal)
```bash
npm run rebuild
```
> ⚠️ This step is **mandatory**. `node-pty` is a native Node.js addon and must be compiled specifically for Electron's Node.js version.

### 6. Start Ollama (in a separate terminal)
```bash
ollama serve
```
> Ollama typically auto-starts after installation. Check `http://localhost:11434` in your browser — if you see a response, it's running.

### 7. Run NovaCoder
```bash
npm run dev
```

This starts the Vite dev server and Electron simultaneously.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+S` | Save active file |
| `Ctrl+\`` | Toggle terminal panel |
| `Ctrl+B` | Toggle file explorer sidebar |
| `Ctrl+J` | Toggle AI chat panel |
| `Ctrl+P` | Command palette (coming soon) |

---

## 📦 Build for Production

```bash
npm run build
```

Output will be in `dist/` — includes platform-specific installers.

---

## 🤖 Supported Ollama Models

Any model available via `ollama pull` works. Recommended:

| Model | Size | Best For |
|---|---|---|
| `codellama` | 7B (3.8GB) | General coding |
| `deepseek-coder` | 6.7B (3.8GB) | Code generation |
| `mistral` | 7B (4.1GB) | General chat + code |
| `llama3.2` | 3B (2GB) | Fast responses |

---

## 🏗️ Architecture

```
novacoder/
├── src/main/          ← Electron main process (Node.js)
│   ├── index.js       ← BrowserWindow + IPC registration
│   ├── fileSystem.js  ← fs + chokidar file operations
│   ├── terminal.js    ← node-pty shell spawning
│   ├── ollama.js      ← Ollama API streaming bridge
│   └── settings.js    ← electron-store persistence
├── src/preload/       ← contextBridge IPC bridge
│   └── preload.js
└── src/renderer/      ← React + Vite UI
    ├── App.jsx        ← Root layout + shortcuts
    ├── store/         ← Zustand global state
    └── components/    ← 10+ UI components
```

---

## 🔧 Troubleshooting

**Terminal doesn't open:**
Run `npm run rebuild` and restart. `node-pty` needs to be compiled for your Electron version.

**AI chat shows "Ollama offline":**
Ensure `ollama serve` is running. Check `http://localhost:11434/api/tags` in your browser.

**Electron loads blank page:**
Wait a few seconds for Vite's dev server to start. The app waits for port 5173 to be ready.

**Model not found error:**
Run `ollama pull <model-name>` and refresh the model list in Settings.
# Vibe-IDE
