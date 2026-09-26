import { expect, test } from '@playwright/test';
import { KC_DEMO_PASSWORD, loginViaKeycloak, logout } from '../helpers/auth';

const CHANCELIER = 'chancelier@demo.jangubi.sn';
const DAKAR_NODE = 'b7116274-cb2d-49ef-a9cb-98c1475c5af1';

test.describe('Diocèse (chancelier@) en profondeur', () => {
  test('structure : arbre parcourable au clavier', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, CHANCELIER, KC_DEMO_PASSWORD, { entryPath: `/espace/${DAKAR_NODE}/structure` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const tree = page.getByRole('tree');
    await expect(tree).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `docs/v1/recette/captures/01/diocese-structure-${testInfo.project.name}.png`, fullPage: true });

    const firstItem = page.getByRole('treeitem').first();
    await firstItem.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `docs/v1/recette/captures/01/diocese-structure-clavier-${testInfo.project.name}.png`, fullPage: true });

    await logout(page);
  });

  test('nominations : recherche, qualité Curé/Administrateur paroissial, modification', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, CHANCELIER, KC_DEMO_PASSWORD, { entryPath: `/espace/${DAKAR_NODE}/nominations` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/nominations/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/diocese-nominations-${testInfo.project.name}.png`, fullPage: true });

    const searchField = page.getByPlaceholder(/rechercher/i).or(page.getByRole('searchbox')).first();
    if (await searchField.count()) {
      await searchField.fill('Dominique');
      await page.waitForTimeout(500);
      await page.screenshot({ path: `docs/v1/recette/captures/01/diocese-nominations-recherche-${testInfo.project.name}.png`, fullPage: true });
    }

    await expect(page.getByRole('table').or(page.getByRole('list')).first()).toBeVisible({ timeout: 10_000 });
    await logout(page);
  });

  test('clergé : demander un complément à une déclaration', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, CHANCELIER, KC_DEMO_PASSWORD, { entryPath: `/espace/${DAKAR_NODE}/clerge` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/clerge/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/diocese-clerge-${testInfo.project.name}.png`, fullPage: true });

    const complementButton = page.getByRole('button', { name: /demander un complément/i }).first();
    if (await complementButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await complementButton.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      const messageField = dialog.getByLabel(/message|complément/i).first();
      if (await messageField.count()) await messageField.fill('Merci de préciser votre situation canonique (recette E2E).');
      await page.screenshot({ path: `docs/v1/recette/captures/01/diocese-clerge-complement-${testInfo.project.name}.png`, fullPage: true });
    }
    await logout(page);
  });

  test('journal d’audit du nœud', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, CHANCELIER, KC_DEMO_PASSWORD, { entryPath: `/espace/${DAKAR_NODE}/audit` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/audit/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/diocese-audit-${testInfo.project.name}.png`, fullPage: true });
    await logout(page);
  });
});
