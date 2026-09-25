import { withSentryConfig } from '@sentry/nextjs';

/**
 * En-têtes de sécurité HTTP. L'application n'en envoyait AUCUN.
 *
 * Choix assumé sur la CSP : on ne pose QUE les directives qui ne peuvent rien
 * casser. Une CSP complète devrait contraindre `script-src`, or Next injecte
 * des scripts inline pour l'hydratation : la verrouiller sans nonce impose
 * `'unsafe-inline'` (qui vide la mesure de son sens) ou casse l'application.
 * Faire les choses correctement demande un nonce par requête posé dans un
 * middleware, puis une vérification sur l'application réelle — un chantier à
 * part, à mener avec l'appli sous les yeux.
 *
 * Les quatre directives ci-dessous, elles, n'ont aucun effet de bord : elles
 * ne restreignent rien de ce que l'application fait légitimement, et ferment
 * des vecteurs réels. `frame-ancestors` n'existe QUE sous forme d'en-tête —
 * impossible à poser via une balise meta.
 */
const securityHeaders = [
  // Empêche le navigateur de « deviner » un type MIME : un fichier déposé par
  // un utilisateur et servi comme du texte ne doit jamais être réinterprété
  // comme du script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Anti-clickjacking. Doublé par `frame-ancestors` pour les navigateurs
  // récents, conservé pour les plus anciens.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Ne pas fuiter le chemin complet vers un site tiers : nos URL contiennent
  // des identifiants de demande de document et de conversation.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // L'application n'utilise ni caméra, ni micro, ni géolocalisation.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Isole la fenêtre des pages tierces ouvertes depuis l'app (liens externes, Keycloak).
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // HTTPS imposé en production (Traefik termine le TLS) ; pas en local (http://localhost).
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : []),
  {
    key: 'Content-Security-Policy',
    value: [
      "frame-ancestors 'none'", // personne ne nous encadre
      "base-uri 'self'", // interdit de détourner la résolution des URL relatives
      "form-action 'self'", // un formulaire ne peut pas poster vers un tiers
      "object-src 'none'", // plus aucun usage légitime de <object>/<embed>
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  // Aligné sur le projet du DSN runtime (NEXT_PUBLIC_SENTRY_DSN →
  // o4511339788042240 / 4511498298327120 = kamalfils-m6/jangubi-dev). Les
  // source-maps doivent monter dans le MÊME projet que celui où les events
  // sont ingérés, sinon les stack traces ne sont jamais symbolisées.
  org: 'kamalfils-m6',
  project: 'jangubi-dev',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  tunnelRoute: '/monitoring',
});
