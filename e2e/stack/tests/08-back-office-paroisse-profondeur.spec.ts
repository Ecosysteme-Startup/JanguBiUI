import { expect, test } from '@playwright/test';

import { KC_DEMO_PASSWORD, loginViaKeycloak, logout } from '../helpers/auth';

const SECRETAIRE = 'secretaire@demo.jangubi.sn';
const SAINT_DOMINIQUE_NODE = 'c64e06b7-cc45-498c-b4c7-a72a5d798756';

test.describe('Back-office paroisse (secretaire@) en profondeur', () => {
  test('annonces : éditeur, bannière + texte alternatif, notifier, feuille du dimanche', async ({ page }, testInfo) => {
    const stamp = Date.now();
    await loginViaKeycloak(page, SECRETAIRE, KC_DEMO_PASSWORD, { entryPath: `/espace/${SAINT_DOMINIQUE_NODE}/annonces/nouvelle` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByLabel(/titre/i).first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `docs/v1/recette/captures/01/annonce-editeur-vide-${testInfo.project.name}.png`, fullPage: true });

    await page.getByLabel(/titre/i).first().fill(`Quête recette E2E ${stamp}`);
    await page.getByRole('group', { name: /catégorie/i }).getByRole('radio').nth(1).check({ force: true });
    const body = page.getByRole('textbox', { name: /corps de l.annonce/i });
    await body.click();
    await body.type('Chers frères et sœurs, ceci est un test de recette automatisée.');

    // Bannière + texte alternatif (accessibilité).
    const bannerInput = page.getByLabel('Image de bannière');
    if (await bannerInput.count()) {
      await bannerInput.setInputFiles({ name: 'recette-e2e.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake-image-bytes') });
      const altField = page.getByLabel(/texte alternatif/i);
      if (await altField.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await altField.fill('Bannière de test recette E2E, façade de la paroisse.');
      }
    }

    // Notifier les fidèles.
    const notifySwitch = page.getByRole('switch', { name: /notifier les fidèles/i });
    if (await notifySwitch.count()) await expect(notifySwitch).toBeVisible();

    await page.screenshot({ path: `docs/v1/recette/captures/01/annonce-editeur-rempli-${testInfo.project.name}.png`, fullPage: true });

    const saveButton = page.getByRole('button', { name: /enregistrer le brouillon|publier/i }).first();
    await saveButton.click();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.screenshot({ path: `docs/v1/recette/captures/01/annonce-enregistree-${testInfo.project.name}.png`, fullPage: true });

    // Feuille du dimanche.
    await page.goto(`/espace/${SAINT_DOMINIQUE_NODE}/annonces/feuille`);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.screenshot({ path: `docs/v1/recette/captures/01/feuille-dimanche-${testInfo.project.name}.png`, fullPage: true });

    await logout(page);
  });

  test('horaires', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, SECRETAIRE, KC_DEMO_PASSWORD, { entryPath: `/espace/${SAINT_DOMINIQUE_NODE}/horaires` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/horaires/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/back-office-horaires-${testInfo.project.name}.png`, fullPage: true });
    await logout(page);
  });

  test('agenda : vue Semaine', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, SECRETAIRE, KC_DEMO_PASSWORD, { entryPath: `/espace/${SAINT_DOMINIQUE_NODE}/agenda` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const weekButton = page.getByRole('button', { name: /semaine/i }).or(page.getByRole('tab', { name: /semaine/i }));
    if (await weekButton.first().isVisible({ timeout: 5_000 }).catch(() => false)) await weekButton.first().click();
    await page.screenshot({ path: `docs/v1/recette/captures/01/back-office-agenda-semaine-${testInfo.project.name}.png`, fullPage: true });
    await logout(page);
  });

  test('équipe', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, SECRETAIRE, KC_DEMO_PASSWORD, { entryPath: `/espace/${SAINT_DOMINIQUE_NODE}/equipe` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/equipe/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/back-office-equipe-${testInfo.project.name}.png`, fullPage: true });
    await logout(page);
  });

  test('paramètres : secrétariat, délais par type d’acte', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, SECRETAIRE, KC_DEMO_PASSWORD, { entryPath: `/espace/${SAINT_DOMINIQUE_NODE}/parametres` });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/parametres/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/back-office-parametres-${testInfo.project.name}.png`, fullPage: true });
    await logout(page);
  });
});
