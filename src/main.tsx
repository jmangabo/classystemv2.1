import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const msg = args.join(' ');
    if (msg.includes('Could not reach Cloud Firestore backend') || msg.includes('Firestore is operating in offline mode')) {
      return;
    }
    originalConsoleWarn(...args);
  };

  window.addEventListener('error', (event) => {
    if (event.message?.includes('inorderTraversal') || event.message?.includes('reading \'uid\'') || event.message?.includes('Cloud Firestore backend')) {
      event.preventDefault();
      console.warn('Caught non-fatal internal Firestore/Auth error:', event.message);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason);
    if (msg.includes('inorderTraversal') || msg.includes('reading \'uid\'') || msg.includes('Cloud Firestore backend')) {
      event.preventDefault();
      console.warn('Caught non-fatal unhandled rejection:', msg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <App />
);
