import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clean up any stale or root-scoped Service Workers from domain root
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    const currentOrigin = window.location.origin;
    const expectedBase = new URL(import.meta.env.BASE_URL, window.location.href).href;
    for (const registration of registrations) {
      if (registration.scope === `${currentOrigin}/` && registration.scope !== expectedBase) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Unregistered conflicting root service worker:', registration.scope);
          }
        });
      }
    }
  }).catch(() => {
    // Ignore
  });
}

createRoot(document.getElementById('root')!).render(<App />);
