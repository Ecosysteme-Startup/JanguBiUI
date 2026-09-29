import { defineConfig, devices } from '@playwright/test';

/**
 * Recette 03 — accessibilité et responsive sur la pile réelle (docs/v1/recette/03-accessibilite-responsive.md).
 * AUCUN webServer : le front (localhost:3000), l'API, Keycloak et Mailpit tournent déjà.
 * Lancement :
 *   set -a; . ../JanguBi/.env; set +a   # pour KC_DEMO_PASSWORD (jamais recopié)
 *   npx playwright test -c e2e/audit/playwright.audit.config.ts
 * Les sessions (storageState) et les mesures brutes vont dans AUDIT_OUT (hors dépôt).
 */
export const AUDIT_OUT =
  process.env.AUDIT_OUT ?? '/tmp/claude-1000/-home-sosza-PycharmProjects-Numerisen/15b0994d-7ed2-4a0a-9ec6-96e5f7bf90f7/scratchpad/audit03';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  retries: 0,
  workers: 3,
  timeout: 600_000,
  reporter: [['list']],
  outputDir: `${AUDIT_OUT}/test-results`,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:3000',
    locale: 'fr-FR',
    timezoneId: 'Africa/Dakar',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'audit', testIgnore: /auth\.setup\.ts/, dependencies: ['setup'] },
  ],
});
