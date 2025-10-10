import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
// Early bootstrap: connect WebSocket ASAP and prep caches
// Avoids waiting for route/user to be ready before starting WS handshake
import useMarketCacheStore from './store/useMarketCacheStore';
import useMarketStore from './store/useMarketStore';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Kick off WS connection and cache initialization immediately
try {
  // Initialize centralized cache (registers to WS router and ensures connection)
  useMarketCacheStore.getState().initialize();
  // Start global connection manager (will hide loader on first WS connect)
  useMarketStore.getState().initiateGlobalConnection();
} catch (_e) {
  // best-effort bootstrap only
}

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
