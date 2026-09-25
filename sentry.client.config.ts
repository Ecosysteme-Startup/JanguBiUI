import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  debug: false,
  // Données religieuses sensibles (loi 2008-12, ENF-F04) : pas d'enregistrement de
  // session, pas de données personnelles, pas de corps de requête.
  sendDefaultPii: false,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
});
