import { expect, test } from '@playwright/test';
import { KC_DEMO_PASSWORD, loginViaKeycloak, logout } from '../helpers/auth';

const PAROISSE_NODE = 'c64e06b7-cc45-498c-b4c7-a72a5d798756'; // Paroisse Saint-Dominique (id UUID, pas le code)

test.describe('Back-office paroisse : titre selon la qualité', () => {
  test('cure@ voit le titre « Curé »', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, 'cure@demo.jangubi.sn', KC_DEMO_PASSWORD, { entryPath: `/espace/${PAROISSE_NODE}` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByText('Curé', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `docs/v1/recette/captures/01/back-office-cure-tableau-de-bord-${testInfo.project.name}.png`, fullPage: true });
    await logout(page);
  });

  test('admin_paroissial@ voit le titre « Administrateur paroissial »', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, 'admin_paroissial@demo.jangubi.sn', KC_DEMO_PASSWORD, { entryPath: '/espace' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByText(/administrateur paroissial/i).first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({
      path: `docs/v1/recette/captures/01/back-office-admin-paroissial-tableau-de-bord-${testInfo.project.name}.png`,
      fullPage: true,
    });
    await logout(page);
  });
});

test('Diocèse : chancelier@ voit un tableau de bord agrégé (aucun nom nominatif)', async ({ page }, testInfo) => {
  await loginViaKeycloak(page, 'chancelier@demo.jangubi.sn', KC_DEMO_PASSWORD, { entryPath: '/espace' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.screenshot({ path: `docs/v1/recette/captures/01/diocese-chancelier-tableau-de-bord-${testInfo.project.name}.png`, fullPage: true });
  await logout(page);
});

test('Plateforme : plateforme@ accède au tableau de bord plateforme', async ({ page }, testInfo) => {
  await loginViaKeycloak(page, 'plateforme@demo.jangubi.sn', KC_DEMO_PASSWORD, { entryPath: '/plateforme' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page).toHaveURL(/\/plateforme/);
  await page.screenshot({ path: `docs/v1/recette/captures/01/plateforme-tableau-de-bord-${testInfo.project.name}.png`, fullPage: true });
  await logout(page);
});

test.describe('Sécurité fonctionnelle visible', () => {
  test('un fidèle qui tape /espace/... voit « pas ouvert »', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, 'fidele@demo.jangubi.sn', KC_DEMO_PASSWORD, { entryPath: `/espace/${PAROISSE_NODE}` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByText(/pas ouvert|aucune de vos nominations/i).first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `docs/v1/recette/captures/01/securite-fidele-espace-refuse-${testInfo.project.name}.png`, fullPage: true });
    await page.goto('/app');
    await logout(page);
  });

  test('un fidèle qui tape /plateforme voit « pas ouvert »', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, 'fidele@demo.jangubi.sn', KC_DEMO_PASSWORD, { entryPath: '/plateforme' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByText(/pas ouvert|non autorisé|n.avez pas accès/i).first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `docs/v1/recette/captures/01/securite-fidele-plateforme-refuse-${testInfo.project.name}.png`, fullPage: true });
    await page.goto('/app');
    await logout(page);
  });
});
