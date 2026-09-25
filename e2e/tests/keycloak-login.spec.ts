import { expect, test } from '@playwright/test';

/**
 * Connexion réelle contre un Keycloak local (tag @keycloak, hors CI) :
 * E2E_KEYCLOAK=1 E2E_KC_USER=… E2E_KC_PASSWORD=… yarn test-e2e --grep @keycloak
 */
test('@keycloak un fidèle se connecte via Keycloak puis se déconnecte', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/realms\/jangubi\/protocol\/openid-connect\/auth/);
  await expect(page.getByRole('heading', { name: 'Se connecter' })).toBeVisible();

  await page.getByLabel('Adresse e-mail').fill(process.env.E2E_KC_USER ?? '');
  await page.getByLabel('Mot de passe', { exact: true }).fill(process.env.E2E_KC_PASSWORD ?? '');
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page).toHaveURL(/\/app$/);
  const session = await page.request.get('/api/auth/session').then((r) => r.json());
  expect(session.accessToken).toBeTruthy();
  expect(session.refreshToken).toBeUndefined();
  expect(await page.evaluate(() => JSON.stringify(window.localStorage))).not.toContain(session.accessToken);

  await page.getByRole('button', { name: /se déconnecter/i }).first().click();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
  const after = await page.request.get('/api/auth/session').then((r) => r.json());
  expect(after).toBeNull();
});
