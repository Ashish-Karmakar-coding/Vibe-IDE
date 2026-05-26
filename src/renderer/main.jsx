import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';
import '@xterm/xterm/css/xterm.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
