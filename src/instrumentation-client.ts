import * as Sentry from '@sentry/nextjs';

const rawDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
const dsnValid = !!(rawDsn && !rawDsn.includes('seu-dsn') && !rawDsn.includes('your-dsn') && rawDsn.startsWith('https://') && rawDsn.includes('@'));

Sentry.init({
  dsn: dsnValid ? rawDsn : '',
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: dsnValid,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
