import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { AUDIT_OUT } from '../playwright.audit.config';
import { DEMO_PASSWORD } from '../helpers/login';
import { measureLayout, runAxe, type AxeFinding } from '../helpers/measure';
import { focusInfo, tabWalk } from '../helpers/keyboard';

/**
 * Recette 03 — pages Keycloak (thème Jàngu Bi) dans leurs états d'erreur et l'écran OTP.
 * L'écran OTP est atteint avec cure@ (OTP déjà enrôlé) SANS soumettre de code : aucun échec compté.
 * Les erreurs de connexion utilisent un compte inexistant (pas de verrouillage d'un compte réel).
 */
const CAPTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../docs/v1/recette/captures/03');
mkdirSync(`${AUDIT_OUT}/keycloak`, { recursive: true });

async function audit(page: Page, id: string) {
  const out: Record<string, unknown> = {};
  const axe: Record<string, AxeFinding[]> = {};
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.waitForTimeout(250);
      if (width !== 320) axe[`${scheme}@${width}`] = await runAxe(page);
    }
    await page.emulateMedia({ colorScheme: 'light' });
    const m = await measureLayout(page);
    out[`layout@${width}`] = { overflow: m.scrollWidth > m.clientWidth + 1, scrollWidth: m.scrollWidth, findings: m.findings };
    if (width !== 320) await page.screenshot({ path: `${CAPTURES}/${id}-${width}.jpg`, fullPage: true, type: 'jpeg', quality: 60 });
  }
  out.axe = axe;
  return out;
}

async function fieldA11y(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('input:not([type=hidden])')).map((i) => {
      const id = i.id;
      const label = id ? document.querySelector(`label[for="${id}"]`)?.textContent?.trim() : null;
      const described = (i.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter(Boolean)
        .map((d) => document.getElementById(d)?.textContent?.trim() ?? `#${d} introuvable`);
      return { id, type: (i as HTMLInputElement).type, label, invalid: i.getAttribute('aria-invalid'), described, autocomplete: i.getAttribute('autocomplete') };
    }),
  );
}

test('KC — connexion en erreur (compte inexistant)', async ({ page }) => {
  await page.goto('/connexion');
  await page.waitForURL(/\/realms\/jangubi\//);
  await page.locator('#username').fill('inexistant-03@test.jangubi.sn');
  await page.locator('#password').fill('mauvais-mot-de-passe');
  await page.locator('#kc-login').click();
  await page.waitForLoadState('domcontentloaded');
  const fields = await fieldA11y(page);
  const focusAfterError = await focusInfo(page);
  const res = { fields, focusAfterError, ...(await audit(page, 'kc-connexion-erreur')) };
  writeFileSync(`${AUDIT_OUT}/keycloak/connexion-erreur.json`, JSON.stringify(res, null, 2));
  expect.soft(fields.filter((f) => f.invalid === 'true' && f.described.length === 0), 'erreur reliée au champ').toEqual([]);
});

test('KC — inscription soumise vide', async ({ page }) => {
  await page.goto('/inscription');
  await page.waitForURL(/\/realms\/jangubi\//);
  const trail = await tabWalk(page, 20);
  await page.locator('form button[type=submit], form input[type=submit]').first().click();
  await page.waitForLoadState('domcontentloaded');
  const fields = await fieldA11y(page);
  const res = { trail, fields, ...(await audit(page, 'kc-inscription-erreur')) };
  writeFileSync(`${AUDIT_OUT}/keycloak/inscription-erreur.json`, JSON.stringify(res, null, 2));
  expect.soft(trail.filter((f) => f.desc !== 'body' && !f.visible).map((f) => f.desc), 'focus visible').toEqual([]);
  expect.soft(fields.filter((f) => f.invalid === 'true' && f.described.length === 0), 'erreurs reliées aux champs').toEqual([]);
});

test('KC — écran de code OTP (cure@, non soumis)', async ({ page }) => {
  test.skip(!DEMO_PASSWORD, 'KC_DEMO_PASSWORD absent');
  await page.goto('/connexion?redirectTo=/espace');
  await page.waitForURL(/\/realms\/jangubi\//);
  await page.locator('#username').fill('cure@demo.jangubi.sn');
  await page.locator('#password').fill(DEMO_PASSWORD);
  await page.locator('#kc-login').click();
  await page.locator('#otp').waitFor({ timeout: 15_000 });
  const fields = await fieldA11y(page);
  const autofocus = await focusInfo(page);
  const res = { fields, autofocus, ...(await audit(page, 'kc-otp')) };
  writeFileSync(`${AUDIT_OUT}/keycloak/otp.json`, JSON.stringify(res, null, 2));
});
