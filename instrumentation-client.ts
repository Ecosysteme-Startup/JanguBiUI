import { captureRouterTransitionStart, startSentry } from '@/lib/sentry-client';

// Sentry est chargé à la demande (src/lib/sentry-client.ts) : hors du JS du premier affichage.
startSentry();

export const onRouterTransitionStart = captureRouterTransitionStart;
