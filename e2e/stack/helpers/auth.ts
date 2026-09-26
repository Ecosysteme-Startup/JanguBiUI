import type { Page } from '@playwright/test';
import { computeFreshTotpCode, extractSecretFromKeyUri, getTotpSecret, saveTotpSecret } from './totp';

export const KC_DEMO_PASSWORD = process.env.KC_DEMO_PASSWORD ?? '';

export interface LoginOptions {
  /** Chemin protégé à ouvrir pour déclencher la redirection Keycloak (défaut `/app`). */
  entryPath?: string;
}

/**
 * Connecte un compte (démo ou nouveau) via le formulaire Keycloak réel.
 * Gère : identifiants, changement de mot de passe imposé (comptes neufs), enrôlement OTP
 * (première connexion d'un responsable) et vérification OTP (connexions suivantes).
 */
export async function loginViaKeycloak(page: Page, email: string, password: string, opts: LoginOptions = {}): Promise<void> {
  await page.goto(opts.entryPath ?? '/app');
  await page.waitForURL(/\/realms\/jangubi\/protocol\/openid-connect\/auth/, { timeout: 15_000 });

  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  const invalidCreds = page.getByText(/invalide|compte est temporairement désactivé|trop de tentatives/i);
  if (await invalidCreds.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
    const msg = (await invalidCreds.first().textContent()) ?? '';
    throw new Error(`Keycloak refuse la connexion de ${email} : "${msg.trim()}".`);
  }

  await handlePostLoginChallenges(page, email);
}

/** Gère les écrans qui peuvent apparaître après le formulaire identifiants/mot de passe. */
async function handlePostLoginChallenges(page: Page, email: string): Promise<void> {
  // Boucle courte : plusieurs écrans (MAJ mot de passe -> enrôlement OTP) peuvent s'enchaîner.
  for (let i = 0; i < 4; i += 1) {
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const url = page.url();
    if (!/\/realms\/jangubi\//.test(url)) return; // revenu sur le front : terminé.

    const unableToScanLink = page.getByRole('link', { name: /impossible de scanner/i });
    if (await unableToScanLink.count()) {
      await unableToScanLink.click(); // révèle la clé manuelle (#kc-totp-secret-key).
    }
    const totpSetupSecret = page.locator('#kc-totp-secret-key');
    // Écran de vérification (thème Jàngu Bi custom, login-otp.ftl) : input id="otp".
    // Écran d'enrôlement (thème de base Keycloak, login-config-totp.ftl) : input id="totp".
    const totpVerifyInput = page.locator('#otp');
    const totpSetupInput = page.locator('#totp');
    const passwordUpdateForm = page.locator('#password-new');

    if (await totpSetupSecret.count()) {
      // Écran d'enrôlement (première connexion d'un responsable).
      const rawSecret = (await totpSetupSecret.first().textContent())?.trim() ?? '';
      const secret = extractSecretFromKeyUri(rawSecret);
      if (!secret) throw new Error(`Secret TOTP introuvable sur l'écran d'enrôlement pour ${email}.`);
      const code = await computeFreshTotpCode(secret);
      await totpSetupInput.fill(code);
      const userLabel = page.locator('#userLabel');
      if (await userLabel.count()) await userLabel.fill('Recette E2E');
      await page.getByRole('button', { name: /soumettre|submit|enregistrer/i }).click();
      saveTotpSecret(email, secret);
      continue;
    }

    if (await totpVerifyInput.count()) {
      // Écran de vérification (compte déjà enrôlé).
      const secret = getTotpSecret(email);
      if (!secret) {
        throw new Error(
          `Écran OTP affiché pour ${email} mais aucun secret partagé trouvé dans totp-secrets.json. ` +
            `Un autre agent doit l'avoir enrôlé en premier, ou l'enrôlement a échoué.`,
        );
      }
      await totpVerifyInput.fill(await computeFreshTotpCode(secret));
      await page.getByRole('button', { name: 'Se connecter' }).click();
      continue;
    }

    if (await passwordUpdateForm.count()) {
      // Ne devrait pas arriver pour les comptes démo ; les comptes neufs choisissent déjà leur mot de passe à l'inscription.
      throw new Error(`Écran de mise à jour du mot de passe inattendu pour ${email}.`);
    }

    return; // aucun écran connu détecté : on considère la connexion terminée.
  }
}

/** Déconnexion via le bouton de l'interface (jamais un appel direct à l'endpoint Keycloak). */
export async function logout(page: Page): Promise<void> {
  const directButton = page.getByRole('button', { name: /se déconnecter/i }).first();
  if (!(await directButton.isVisible({ timeout: 2_000 }).catch(() => false))) {
    // Mobile/tablette : le bouton est replié dans le menu (hamburger) ou le menu profil.
    const menuButton = page.getByRole('button', { name: /menu|ouvrir la navigation|profil/i }).first();
    if (await menuButton.count()) await menuButton.click().catch(() => undefined);
  }
  const finalButton = page.getByRole('button', { name: /se déconnecter/i }).first();
  await finalButton.scrollIntoViewIfNeeded().catch(() => undefined);
  await finalButton.click({ timeout: 10_000 });
  await page.waitForURL(/localhost:\d+\/?$/, { timeout: 15_000 });
}
