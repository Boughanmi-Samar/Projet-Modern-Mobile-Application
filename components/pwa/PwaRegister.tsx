'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service worker enregistré avec succès:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Échec enregistrement service worker:', err);
        });
    }
  }, []);

  return null;
}
