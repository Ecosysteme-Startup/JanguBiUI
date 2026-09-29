import { expect, test } from '@playwright/test';

import { KC_DEMO_PASSWORD, loginViaKeycloak, logout } from '../helpers/auth';

const FIDELE = 'fidele@demo.jangubi.sn';
const SECRETAIRE = 'secretaire@demo.jangubi.sn';
const SAINT_DOMINIQUE_NODE = 'c64e06b7-cc45-498c-b4c7-a72a5d798756';

test('Demande d’acte : dépôt (fidèle) → traitement (secrétaire) → complément (fidèle) → suivi', async ({ browser }, testInfo) => {
  const stamp = Date.now();

  // --- 1. Fidèle : dépose une demande à la paroisse du sacrement (Saint-Dominique). ---
  const fideleCtx = await browser.newContext();
  const fidelePage = await fideleCtx.newPage();
  await loginViaKeycloak(fidelePage, FIDELE, KC_DEMO_PASSWORD, { entryPath: '/app/demandes/nouvelle' });
  await expect(fidelePage).toHaveURL(/\/app\/demandes\/nouvelle/);
  await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/demande-etape1-type-${testInfo.project.name}.png`, fullPage: true });

  await fidelePage.getByRole('radio', { name: /certificat de baptême/i }).click();
  await fidelePage.getByRole('button', { name: /continuer/i }).click();

  await fidelePage.getByLabel(/nom de la paroisse/i).fill('Dominique');
  await fidelePage.getByRole('radio', { name: /saint-dominique/i }).first().click();
  await fidelePage.getByRole('button', { name: /continuer/i }).click();
  await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/demande-etape3-infos-${testInfo.project.name}.png`, fullPage: true });

  await fidelePage.getByLabel(/date de naissance/i).fill(`14/03/1992`);
  await fidelePage.getByLabel(/lieu de naissance/i).fill('Dakar');
  const pereField = fidelePage.getByLabel(/nom et prénoms du père/i);
  if (await pereField.count()) await pereField.fill('Étienne Diouf (E2E)');
  const mereField = fidelePage.getByLabel(/nom de jeune fille de la mère/i);
  if (await mereField.count()) await mereField.fill(`Hélène Gomis E2E ${stamp}`);
  const telField = fidelePage.getByLabel(/téléphone/i);
  if (await telField.count()) await telField.fill('771234567');
  const moisField = fidelePage.getByLabel(/mois du baptême/i);
  if (await moisField.count()) await moisField.selectOption({ index: 1 });
  const anneeField = fidelePage.getByLabel(/année du baptême/i);
  if (await anneeField.count()) await anneeField.fill('1992');
  // Au clavier : sous 1024 px, la barre de navigation fixe du bas peut recouvrir la pastille au défilement.
  const personalUse = fidelePage.getByRole('radio', { name: /usage personnel/i });
  await personalUse.focus();
  await personalUse.press('Space');
  await expect(personalUse).toBeChecked();
  const consentBox = fidelePage.getByRole('checkbox').first();
  if (await consentBox.count()) await consentBox.check();
  await fidelePage.getByRole('button', { name: /voir le récapitulatif|continuer/i }).click();
  await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/demande-recapitulatif-${testInfo.project.name}.png`, fullPage: true });

  await fidelePage.getByRole('button', { name: /envoyer la demande/i }).click();
  await fidelePage.waitForURL(/\/app\/demandes\/[0-9a-f-]+/, { timeout: 15_000 });
  await fidelePage.waitForLoadState('networkidle').catch(() => undefined);
  const requestUrl = fidelePage.url();
  const requestId = requestUrl.split('/').pop();
  await expect(fidelePage.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
  await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/demande-suivi-envoyee-${testInfo.project.name}.png`, fullPage: true });

  // Aucun PDF d'acte ni note interne visible côté fidèle.
  await expect(fidelePage.getByText(/note interne|non visibles du fidèle/i)).toHaveCount(0);
  await expect(fidelePage.getByText(/\.pdf/i)).toHaveCount(0);
  await logout(fidelePage);
  await fideleCtx.close();

  // --- 2. Secrétaire : traite la demande (file d'attente, assignation, complément). ---
  const secCtx = await browser.newContext();
  const secPage = await secCtx.newPage();
  await loginViaKeycloak(secPage, SECRETAIRE, KC_DEMO_PASSWORD, { entryPath: `/espace/${SAINT_DOMINIQUE_NODE}/demandes` });
  await expect(secPage).toHaveURL(/\/demandes/);
  await secPage.screenshot({ path: `docs/v1/recette/captures/01/demande-file-secretariat-${testInfo.project.name}.png`, fullPage: true });

  if (requestId) {
    await secPage.goto(`/espace/${SAINT_DOMINIQUE_NODE}/demandes/${requestId}`);
  } else {
    await secPage.getByRole('table').getByText(/awa|diop/i).first().click();
  }
  await secPage.waitForLoadState('networkidle').catch(() => undefined);
  await expect(secPage.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
  await secPage.screenshot({ path: `docs/v1/recette/captures/01/demande-detail-secretariat-${testInfo.project.name}.png`, fullPage: true });

  const startVerifButton = secPage.getByRole('button', { name: /commencer la vérification/i });
  if (await startVerifButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await startVerifButton.click();
    await secPage.waitForLoadState('networkidle').catch(() => undefined);
  }

  // Panneau « Statut » (maquette PAR-Demande-Detail) : choix du statut suivant, puis bouton d'action.
  const supplementChoice = secPage.getByRole('radio', { name: /^complément demandé/i });
  await expect(supplementChoice).toBeVisible({ timeout: 10_000 });
  await supplementChoice.focus();
  await supplementChoice.press('Space');
  await expect(supplementChoice).toBeChecked();
  const supplementButton = secPage.getByRole('button', { name: 'Demander un complément' });
  await expect(supplementButton).toBeVisible();
  await supplementButton.click();
  const dialog = secPage.getByRole('dialog', { name: 'Demander un complément' });
  await dialog.getByLabel(/complément attendu/i).fill('Merci de préciser le nom de la marraine (recette E2E).');
  await dialog.getByRole('button', { name: /envoyer la demande de complément/i }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });
  await secPage.screenshot({ path: `docs/v1/recette/captures/01/demande-complement-demande-${testInfo.project.name}.png`, fullPage: true });
  await expect(secPage.getByText(/complément demandé/i).first()).toBeVisible();
  await logout(secPage);
  await secCtx.close();

  // --- 3. Fidèle : répond au complément et voit le suivi mis à jour. ---
  const fideleCtx2 = await browser.newContext();
  const fidelePage2 = await fideleCtx2.newPage();
  await loginViaKeycloak(fidelePage2, FIDELE, KC_DEMO_PASSWORD, {
    entryPath: requestId ? `/app/demandes/${requestId}` : '/app/demandes',
  });
  await fidelePage2.waitForLoadState('networkidle').catch(() => undefined);
  await expect(fidelePage2.getByRole('heading', { name: /besoin d.un complément/i })).toBeVisible({ timeout: 15_000 });
  await fidelePage2.screenshot({ path: `docs/v1/recette/captures/01/demande-suivi-complement-${testInfo.project.name}.png`, fullPage: true });

  await fidelePage2.getByRole('button', { name: /envoyer le complément/i }).click();
  await fidelePage2.getByLabel(/votre réponse/i).fill('Ma marraine est Mme Élisabeth Gomis (recette E2E).');
  await fidelePage2.getByRole('button', { name: /envoyer le complément/i }).click();
  await expect(fidelePage2.getByRole('heading', { name: /besoin d.un complément/i })).toBeHidden({ timeout: 10_000 });
  await fidelePage2.screenshot({ path: `docs/v1/recette/captures/01/demande-suivi-final-${testInfo.project.name}.png`, fullPage: true });
  await logout(fidelePage2);
  await fideleCtx2.close();
});
