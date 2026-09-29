import { defineConfig } from '@playwright/test';

/**
 * Comparaison visuelle app ↔ maquettes « Ciel produit » (voir e2e/visuel/README.md).
 * Aucun webServer : le front (localhost:3000), l'API et Keycloak tournent déjà.
 * Un seul worker : les connexions Keycloak (TOTP) d'un même compte ne doivent jamais se chevaucher.
 *
 *   KC_DEMO_PASSWORD=… VISUEL_ECRANS=WEB-FID-Parole,WEB-Erreur-404 \
 *     npx playwright test -c e2e/visuel/playwright.visuel.config.ts
 */
export default defineConfig({
  testDir: '.',
  testMatch: /visuel\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  reporter: [['list']],
  outputDir: './resultats/.playwright',
  use: {
    baseURL: process.env.VISUEL_BASE_URL ?? 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    locale: 'fr-FR',
    colorScheme: 'light',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
});
