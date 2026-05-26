import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/renderer/index.html'),
    },
    target: 'chrome114', // Electron's Chromium version
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
  optimizeDeps: {
    include: ['marked', 'highlight.js', 'zustand'],
    exclude: ['electron', 'node-pty', 'chokidar', 'electron-store'],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  worker: {
    format: 'es',
  },
});
