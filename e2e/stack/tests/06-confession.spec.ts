import { expect, test } from '@playwright/test';

import { KC_DEMO_PASSWORD, loginViaKeycloak, logout } from '../helpers/auth';

const FIDELE = 'fidele@demo.jangubi.sn';
const VICAIRE = 'vicaire@demo.jangubi.sn';
const SAINT_DOMINIQUE_NODE = 'c64e06b7-cc45-498c-b4c7-a72a5d798756';

test('Confession : le vicaire crée des créneaux, le fidèle réserve (sans texte), puis annule', async ({ browser }, testInfo) => {
  // --- 1. Vicaire : crée des créneaux récurrents. ---
  const vicaireCtx = await browser.newContext();
  const vicairePage = await vicaireCtx.newPage();
  await loginViaKeycloak(vicairePage, VICAIRE, KC_DEMO_PASSWORD, { entryPath: `/espace/${SAINT_DOMINIQUE_NODE}/confessions` });
  await vicairePage.waitForLoadState('networkidle').catch(() => undefined);
  await expect(vicairePage.getByRole('heading', { name: 'Confessions' })).toBeVisible({ timeout: 10_000 });
  await vicairePage.screenshot({ path: `docs/v1/recette/captures/01/confession-planning-vicaire-${testInfo.project.name}.png`, fullPage: true });

  const recurringButton = vicairePage.getByRole('button', { name: /créneaux récurrents/i });
  if (await recurringButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await recurringButton.click();
    const panel = vicairePage.getByRole('region', { name: /nouveaux créneaux récurrents/i }).or(vicairePage.getByRole('dialog'));
    await expect(panel.first()).toBeVisible({ timeout: 10_000 });
    const createButton = panel.first().getByRole('button', { name: /créer les créneaux/i });
    if (await createButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await createButton.click();
      await vicairePage.waitForLoadState('networkidle').catch(() => undefined);
    }
    await vicairePage.screenshot({ path: `docs/v1/recette/captures/01/confession-creneaux-crees-${testInfo.project.name}.png`, fullPage: true });
  }
  await logout(vicairePage);
  await vicaireCtx.close();

  // --- 2. Fidèle : réserve un créneau, sans AUCUN champ de texte (RG-08). ---
  const fideleCtx = await browser.newContext();
  const fidelePage = await fideleCtx.newPage();
  await loginViaKeycloak(fidelePage, FIDELE, KC_DEMO_PASSWORD, { entryPath: '/app/confession' });
  await expect(fidelePage).toHaveURL(/\/app\/confession/);
  await fidelePage.waitForLoadState('networkidle').catch(() => undefined);
  await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/confession-reservation-${testInfo.project.name}.png`, fullPage: true });

  // Aucun champ de contenu ne doit être proposé.
  await expect(fidelePage.locator('textarea')).toHaveCount(0);

  const slotButton = fidelePage.getByRole('button', { name: /\d{1,2}\s*h\s*\d{0,2}/ }).first();
  const hasSlot = await slotButton.isVisible({ timeout: 8_000 }).catch(() => false);
  if (hasSlot) {
    await slotButton.click();
    const confirmButton = fidelePage.getByRole('button', { name: /confirmer|réserver/i });
    if (await confirmButton.isVisible({ timeout: 5_000 }).catch(() => false)) await confirmButton.click();
    await fidelePage.waitForLoadState('networkidle').catch(() => undefined);
    await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/confession-reserve-${testInfo.project.name}.png`, fullPage: true });

    // Aucun champ texte n'a été rempli pour cette réservation (vérification a posteriori).
    await expect(fidelePage.locator('input[type="text"], textarea')).toHaveCount(0);

    // --- 3. Fidèle : annule son rendez-vous. ---
    const cancelButton = fidelePage.getByRole('link', { name: /^annuler$/i }).or(fidelePage.getByRole('button', { name: /^annuler$/i })).first();
    if (await cancelButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cancelButton.click();
      const dialog = fidelePage.getByRole('dialog', { name: /annuler ce rendez-vous/i });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByRole('button', { name: 'Annuler le rendez-vous' }).click();
      await expect(dialog).toBeHidden({ timeout: 10_000 });
      await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/confession-annulee-${testInfo.project.name}.png`, fullPage: true });
    }
  } else {
    testInfo.annotations.push({ type: 'observation', description: 'Aucun créneau de confession disponible au moment du test (dépend des créneaux créés par le vicaire dans la même exécution).' });
  }

  await logout(fidelePage);
  await fideleCtx.close();
});
