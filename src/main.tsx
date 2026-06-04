import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe, one-time cleanup of any legacy or broken service workers to prevent "Page Not Found" caching issues
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const CLEANUP_KEY = 'griya_sw_cleanup_v5';
  if (!localStorage.getItem(CLEANUP_KEY)) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length > 0) {
        Promise.all(registrations.map(r => r.unregister())).then(() => {
          localStorage.setItem(CLEANUP_KEY, 'true');
          if ('caches' in window) {
            caches.keys().then((names) => {
              Promise.all(names.map(name => caches.delete(name))).then(() => {
                (window as any).location.reload();
              });
            });
          } else {
            (window as any).location.reload();
          }
        });
      } else {
        localStorage.setItem(CLEANUP_KEY, 'true');
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
