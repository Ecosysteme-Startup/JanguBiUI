import { expect, test } from '@playwright/test';
import { extractFirstLink, waitForLastEmail } from '../helpers/mailpit';
import { logout } from '../helpers/auth';

test('Inscription complète : /inscription → vérification e-mail (Mailpit) → /bienvenue → /app, puis déconnexion et reconnexion', async ({
  page,
}, testInfo) => {
  const stamp = Date.now();
  const email = `agent01+${stamp}@test.jangubi.sn`;
  const password = 'Recette-E2E-9f3b1!';

  // Étape 1 : formulaire Keycloak d'inscription (thème Jàngu Bi), avec téléphone +221.
  await page.goto('/inscription');
  await page.waitForURL(/\/realms\/jangubi\/protocol\/openid-connect\/(registrations|auth)/, { timeout: 15_000 });
  await page.screenshot({ path: `docs/v1/recette/captures/01/inscription-etape1-${testInfo.project.name}.png`, fullPage: true });

  await page.getByLabel(/prénom/i).fill('Agent');
  await page.getByLabel('Nom', { exact: true }).fill('UnTest');
  await page.getByLabel(/adresse e-mail/i).fill(email);
  const phoneField = page.getByLabel(/téléphone mobile/i);
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

  await page.getByLabel(/nom, quartier ou ville/i).fill('Dominique');
  await page.getByRole('radio', { name: /saint-dominique/i }).click();
  await page.getByRole('checkbox', { name: /appartenance à la paroisse/i }).check();
  await page.getByRole('checkbox', { name: /conditions d.utilisation/i }).check();
  await page.getByRole('button', { name: /terminer mon inscription/i }).click();

  await page.waitForURL(/\/app/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/app/);
  await page.screenshot({ path: `docs/v1/recette/captures/01/inscription-app-${testInfo.project.name}.png`, fullPage: true });

  // Déconnexion globale puis reconnexion.
  await logout(page);
  await expect(page).toHaveURL(/localhost:\d+\/?$/);
});
