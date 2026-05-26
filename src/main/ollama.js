const http = require('http');

const OLLAMA_BASE = 'http://localhost:11434';

const SYSTEM_PROMPT = `You are an expert coding assistant inside NovaCoder IDE.
When writing code that should be saved to a file, always wrap it in XML tags like this:
<file path="FILEPATH">
CODE HERE
</file>
This allows the IDE to automatically apply your code to the correct file.
Be concise and focus on code. When explaining, be brief and direct.`;

// ─── Raw HTTP streaming helper ────────────────────────────────────────────────
function streamRequest(url, body, onChunk, onDone, onError) {
  const urlObj = new URL(url);
  const postData = JSON.stringify(body);

  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || 80,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res) => {
    let fullText = '';
    let buffer = '';

    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            fullText += parsed.message.content;
            onChunk(parsed.message.content);
          }
          if (parsed.done) {
            onDone(fullText);
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    });

    res.on('end', () => {
      // Handle any remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.message?.content) {
            fullText += parsed.message.content;
            onChunk(parsed.message.content);
          }
        } catch {}
      }
      onDone(fullText);
    });
  });

  req.on('error', onError);
  req.setTimeout(30000, () => {
    req.destroy(new Error('Ollama request timed out after 30s'));
  });

  req.write(postData);
  req.end();

  return req;
}

// ─── Simple GET request ───────────────────────────────────────────────────────
function getRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('Timeout')));
  });
}

// ─── Check if Ollama is running ────────────────────────────────────────────────
async function checkOllamaRunning() {
  try {
    await getRequest(`${OLLAMA_BASE}/api/tags`);
    return true;
  } catch {
    return false;
  }
}

// ─── List available models ─────────────────────────────────────────────────────
async function listModels() {
  try {
    const data = await getRequest(`${OLLAMA_BASE}/api/tags`);
    return (data.models || []).map(m => m.name);
  } catch {
    return [];
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
function setupOllamaHandlers(ipcMain, mainWindow) {
  // Check if Ollama is running
  ipcMain.handle('ollama:checkRunning', async () => {
    return checkOllamaRunning();
  });

  // List available models
  ipcMain.handle('ollama:listModels', async () => {
    return listModels();
  });

  // Chat with streaming
  ipcMain.handle('ollama:chat', async (_, model, messages) => {
    return new Promise((resolve, reject) => {
      const allMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ];

      const body = {
        model,
        messages: allMessages,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 4096,
        },
      };

      let requestAborted = false;

      const req = streamRequest(
        `${OLLAMA_BASE}/api/chat`,
        body,
        // onChunk: stream token to renderer
        (chunk) => {
          if (!requestAborted && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ollama:chunk', chunk);
          }
        },
        // onDone: resolve with full text
        (fullText) => {
          if (!requestAborted) {
            mainWindow?.webContents.send('ollama:done', fullText);
            resolve(fullText);
          }
        },
        // onError
        (err) => {
          requestAborted = true;
          mainWindow?.webContents.send('ollama:error', err.message);
          reject(err);
        }
      );

      // Handle window closing during stream
      if (mainWindow) {
        mainWindow.once('closed', () => {
          requestAborted = true;
          req.destroy();
        });
      }
    });
  });
}

module.exports = { setupOllamaHandlers, checkOllamaRunning, listModels };
