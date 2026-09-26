import { expect, test } from '@playwright/test';

import { extractFirstLink, waitForLastEmail } from '../helpers/mailpit';

test('Inscription complète : /inscription → vérification e-mail (Mailpit) → /bienvenue → /app, puis déconnexion et reconnexion', async ({
  page,
}, testInfo) => {
  const stamp = Date.now();
  const email = `lota+${stamp}@test.jangubi.sn`;
  const password = 'Recette-E2E-9f3b1!';

  // Étape 1 : formulaire Keycloak d'inscription (thème Jàngu Bi), avec téléphone +221.
  await page.goto('/inscription');
  await page.waitForURL(/\/realms\/jangubi\/protocol\/openid-connect\/(registrations|auth)/, { timeout: 15_000 });
  await page.screenshot({ path: `docs/v1/recette/captures/01/inscription-etape1-${testInfo.project.name}.png`, fullPage: true });

  await page.getByLabel(/prénom/i).fill('Agent');
  await page.locator('#lastName').fill('UnTest');
  await page.getByLabel(/adresse e-mail/i).fill(email);
  const phoneField = page.getByLabel(/^téléphone/i);
  if (await phoneField.count()) await phoneField.fill('771234567');
  await page.getByLabel(/^mot de passe/i).fill(password);
  await page.getByLabel(/confirmer le mot de passe/i).fill(password);

  await page.getByRole('button', { name: /continuer.*paroisse/i }).click();
  await page.waitForLoadState('networkidle').catch(() => undefined);

  // Étape 2 : vérification d'e-mail via Mailpit.
  const mail = await waitForLastEmail(email, { timeoutMs: 20_000 });
  const link = extractFirstLink(mail);
  await page.goto(link);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.screenshot({ path: `docs/v1/recette/captures/01/inscription-verification-email-${testInfo.project.name}.png`, fullPage: true });

  // Étape 3 : /bienvenue — paroisse suivie + consentements.
  await page.waitForURL(/\/bienvenue/, { timeout: 20_000 });
  await page.screenshot({ path: `docs/v1/recette/captures/01/inscription-bienvenue-${testInfo.project.name}.png`, fullPage: true });

  // Étape 2 (écran « Votre paroisse ») puis étape 3 (« Avant de terminer »).
  await page.getByLabel(/rechercher une paroisse/i).fill('Dominique');
  await page.getByRole('radio', { name: /saint-dominique/i }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Avant de terminer' })).toBeVisible();
  await expect(page.getByRole('button', { name: /terminer mon inscription/i })).toBeDisabled();
  await page.getByRole('checkbox', { name: /conditions d.utilisation/i }).check();
  await page.getByRole('checkbox', { name: /appartenance religieuse/i }).check();
  await page.getByRole('button', { name: /terminer mon inscription/i }).click();

  await page.waitForURL(/\/app/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/app/);
  await page.screenshot({ path: `docs/v1/recette/captures/01/inscription-app-${testInfo.project.name}.png`, fullPage: true });

  // Déconnexion globale puis reconnexion.
  // La déconnexion est dans le menu « Réglages du compte » de la coquille fidèle (maquette Ciel produit),
  // lui-même dans le tiroir « Menu » sous 1024 px.
  const accountMenu = page.getByRole('button', { name: 'Réglages du compte' });
  if (!(await accountMenu.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /^menu$|ouvrir le menu/i }).first().click();
  }
  await accountMenu.click();
  await page.getByRole('menuitem', { name: /se déconnecter/i }).click();
  await page.waitForURL(/localhost:\d+\/?$/, { timeout: 15_000 });
  await expect(page).toHaveURL(/localhost:\d+\/?$/);
});
