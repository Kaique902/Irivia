'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, background: '#09090b', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Algo deu errado</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Um erro inesperado ocorreu. Já fomos notificados.</p>
            <button onClick={reset} style={{
              padding: '0.75rem 1.5rem', borderRadius: '0.75rem', background: '#f97316',
              color: '#fff', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.875rem',
            }}>Tentar novamente</button>
          </div>
        </div>
      </body>
    </html>
  );
}
