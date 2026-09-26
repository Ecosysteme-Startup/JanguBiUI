import type { Page } from '@playwright/test';
import { computeTotpCode, getTotpSecret, saveTotpSecret } from '../../stack/helpers/totp';

/**
 * Connexion Keycloak robuste pour l'audit 03 (accessibilité / responsive).
 * Diffère du helper `stack/helpers/auth.ts` sur deux points constatés sur le thème réel :
 *  - l'écran de vérification OTP du thème Jàngu Bi utilise `#otp` (et non `#totp`) ;
 *  - l'écran d'enrôlement (thème `base`) n'affiche le secret qu'en mode « manuel ».
 */
export const DEMO_PASSWORD = process.env.KC_DEMO_PASSWORD ?? '';

/**
 * Responsable sans OTP (le flux `browser-mfa` n'impose l'OTP qu'aux comptes déjà configurés) :
 * enrôlement comme le ferait l'utilisateur, depuis la console de compte Keycloak
 * (« Connexion » > « Configurer Application d'authentification »), puis reconnexion avec OTP.
 * Ne fait rien si un secret est déjà partagé (jamais de réinitialisation).
 */
export async function ensureStaffMfa(page: Page, email: string, entryPath: string): Promise<void> {
  if (getTotpSecret(email)) return;
  await page.goto('http://localhost:8180/realms/jangubi/account/account-security/signing-in');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  if (getTotpSecret(email)) return; // un autre agent l'a fait entre-temps
  await page.locator('[data-testid="otp/create"], #otp\\/create').first().click();
  await page.waitForURL(/login-actions|openid-connect\/auth/, { timeout: 20_000 });
  await handleKeycloakScreens(page, email, /\/account\//);
  await page.context().clearCookies();
  await login(page, email, entryPath);
}

export async function login(page: Page, email: string, entryPath = '/app'): Promise<void> {
  if (!DEMO_PASSWORD) throw new Error('KC_DEMO_PASSWORD absent de l’environnement.');
  await page.goto(entryPath);
  await page.waitForURL(/\/realms\/jangubi\//, { timeout: 20_000 });
  await page.locator('#username').fill(email);
  await page.locator('#password').fill(DEMO_PASSWORD);
  await page.locator('#kc-login').click();
  await handleKeycloakScreens(page, email);
}

/**
 * Keycloak refuse de réutiliser un code OTP (codeReusable=false) : si ce compte vient de servir un
 * code dans la fenêtre courante (enrôlement, autre agent), on attend la fenêtre suivante.
 */
const lastWindow = new Map<string, number>();
async function freshCode(page: Page, email: string, secret: string, forceNext = false): Promise<string> {
  const win = () => Math.floor(Date.now() / 30_000);
  if (forceNext || lastWindow.get(email) === win()) {
    const wait = 30_000 - (Date.now() % 30_000) + 500;
    await page.waitForTimeout(wait);
  }
  lastWindow.set(email, win());
  return computeTotpCode(secret);
}

async function handleKeycloakScreens(page: Page, email: string, doneUrl?: RegExp): Promise<void> {
  for (let i = 0; i < 9; i += 1) {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(400);
    if (doneUrl ? doneUrl.test(page.url()) : !/\/realms\/jangubi\//.test(page.url())) return;

    // Enrôlement : passer en mode manuel pour lire le secret.
    const manualLink = page.locator('#mode-manual, a[href*="mode=manual"]');
    const secretEl = page.locator('#kc-totp-secret-key');
    if ((await manualLink.count()) && !(await secretEl.count())) {
      await manualLink.first().click();
      continue;
    }
    if (await secretEl.count()) {
      const secret = ((await secretEl.first().textContent()) ?? '').replace(/\s+/g, '');
      // Si un autre agent a déjà enregistré un secret pour ce compte, on ne l'écrase pas :
      // l'écran d'enrôlement signifierait qu'aucun OTP n'existe encore côté Keycloak.
      await page.locator('#totp').fill(await freshCode(page, email, secret));
      if (await page.locator('#userLabel').count()) await page.locator('#userLabel').fill('Recette 03');
      await page.locator('#saveTOTPBtn, input[type=submit], button[type=submit]').first().click();
      saveTotpSecret(email, secret);
      continue;
    }
    const otpInput = page.locator('#otp, #totp');
    if (await otpInput.count()) {
      const secret = getTotpSecret(email);
      if (!secret) throw new Error(`OTP demandé pour ${email} sans secret partagé.`);
      const invalid = (await page.locator('#input-error-otp-code').textContent().catch(() => ''))?.trim();
      await otpInput.first().fill(await freshCode(page, email, secret, !!invalid));
      await page.locator('#kc-login, button[type=submit]').first().click();
      continue;
    }
    const err = await page.locator('.jb-error, .jb-alert').allTextContents();
    throw new Error(`Écran Keycloak inattendu pour ${email} (${page.url()}) : ${err.join(' / ')}`);
  }
  throw new Error(`Connexion ${email} : trop d'écrans intermédiaires.`);
}
