import * as Sentry from '@sentry/nextjs';

import { sentryPrivacyOptions } from '@/lib/sentry-scrub';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  debug: false,
  // Données religieuses sensibles (loi 2008-12, ENF-F04) : pas d'enregistrement de session,
  // et filtre systématique des évènements (src/lib/sentry-scrub.ts).
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
  ...sentryPrivacyOptions,
});
