import type { MetadataRoute } from 'next';

import { BRAND_INK } from '@/components/ui/logo';

/** Manifeste web : icônes générées depuis le logo officiel (scripts/generer-icones.mjs). */
const manifest = (): MetadataRoute.Manifest => ({
  name: 'Jàngu Bi',
  short_name: 'Jàngu Bi',
  description: 'La Parole, la vie de votre paroisse et vos démarches, pour les fidèles catholiques du Sénégal.',
  lang: 'fr',
  start_url: '/',
  display: 'standalone',
  background_color: '#FFFFFF',
  theme_color: BRAND_INK,
  icons: [
    { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
    { src: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
    { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    { src: '/icons/maskable-512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
  ],
});

export default manifest;
