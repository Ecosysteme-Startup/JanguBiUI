import { defineConfig, devices } from '@playwright/test';

/**
 * Recette E2E sur la pile réelle (voir docs/v1/recette/00-BRIEF-RECETTE.md).
 * AUCUN webServer : le front (localhost:3000), l'API, Keycloak et Mailpit tournent déjà.
 * Lancement : npx playwright test -c e2e/stack/playwright.stack.config.ts
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 2,
  timeout: 60_000,
  reporter: [['list'], ['html', { outputFolder: '../../playwright-report-stack', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } } },
    { name: 'tablette', use: { viewport: { width: 768, height: 1024 }, userAgent: devices['iPad (gen 7)'].userAgent } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
});
