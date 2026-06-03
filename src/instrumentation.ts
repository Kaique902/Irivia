import * as Sentry from '@sentry/nextjs';

function isValidDsn(dsn: string): boolean {
  if (!dsn) return false;
  if (dsn.includes('seu-dsn') || dsn.includes('your-dsn')) return false;
  return dsn.startsWith('https://') && dsn.includes('@');
}

export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '';
  if (!isValidDsn(dsn)) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  });
}
