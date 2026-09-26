import { sentryPrivacyOptions } from '@/lib/sentry-scrub';

type SentryModule = typeof import('@/lib/sentry-sdk');

/**
 * Sentry côté navigateur, chargé À LA DEMANDE (recette perf 04 : ~50 Ko gzip de moins dans le
 * JS du premier affichage). Le SDK est téléchargé quand le navigateur est inactif après le
 * `load`, ou tout de suite à la première erreur. Les erreurs survenues avant sont mises de côté
 * puis envoyées : rien n'est perdu, seul l'envoi est différé.
 */
let sentry: SentryModule | null = null;
let loading: Promise<SentryModule> | null = null;

const MAX_EARLY_ERRORS = 10;
const earlyErrors: unknown[] = [];

const init = (Sentry: SentryModule) => {
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
  return Sentry;
};

export const loadSentry = (): Promise<SentryModule> => {
  loading ??= import('@/lib/sentry-sdk').then((Sentry) => {
    sentry = init(Sentry);
    removeEarlyListeners();
    earlyErrors.splice(0).forEach((error) => Sentry.captureException(error));
    return Sentry;
  });
  return loading;
};

/** Signale une erreur (limites d'erreur React) ; charge le SDK si besoin. */
export const captureException = (error: unknown) => {
  if (sentry) sentry.captureException(error);
  else void loadSentry().then((Sentry) => Sentry.captureException(error));
};

/** Transitions de route (tracing) : ignorées tant que le SDK n'est pas chargé. */
export const captureRouterTransitionStart: SentryModule['captureRouterTransitionStart'] = (...args) =>
  sentry?.captureRouterTransitionStart(...args);

const onEarlyError = (event: ErrorEvent) => {
  if (earlyErrors.length < MAX_EARLY_ERRORS) earlyErrors.push(event.error ?? event.message);
  void loadSentry();
};
const onEarlyRejection = (event: PromiseRejectionEvent) => {
  if (earlyErrors.length < MAX_EARLY_ERRORS) earlyErrors.push(event.reason);
  void loadSentry();
};
function removeEarlyListeners() {
  window.removeEventListener('error', onEarlyError);
  window.removeEventListener('unhandledrejection', onEarlyRejection);
}

/** À appeler une fois, au démarrage du client (instrumentation-client.ts). */
export const startSentry = () => {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  window.addEventListener('error', onEarlyError);
  window.addEventListener('unhandledrejection', onEarlyRejection);
  const whenIdle = () =>
    'requestIdleCallback' in window ? window.requestIdleCallback(() => void loadSentry(), { timeout: 5000 }) : setTimeout(() => void loadSentry(), 2000);
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
};
