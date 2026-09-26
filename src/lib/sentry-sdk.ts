/**
 * Seules fonctions du SDK Sentry utilisées dans le navigateur. Importé dynamiquement par
 * `sentry-client.ts` : un `import('@sentry/nextjs')` direct chargerait l'espace de noms entier,
 * sans élagage (~180 Ko gzip au lieu d'~50).
 */
export { captureException, captureRouterTransitionStart, init } from '@sentry/nextjs';
