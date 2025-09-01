import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import homieIcon from './assets/homie.png';

// Ensure favicon points to bundled asset in both dev and prod
(() => {
  try {
    const selector = "link[rel='icon'], link[rel='shortcut icon']";
    let link = document.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (link) {
      link.href = homieIcon as unknown as string;
    }
  } catch {
    // no-op
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
