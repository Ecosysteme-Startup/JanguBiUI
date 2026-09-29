/**
 * Captures de /bienvenue (WEB-Inscription-Paroisse, WEB-Inscription-Consentement) avec un compte
 * jetable `lota+<horodatage>@test.jangubi.sn` créé par l'inscription Keycloak (vérification via Mailpit).
 * Usage : npx tsx e2e/visuel/lots/lot-a-public/bienvenue.ts [--mobile]
 */
import fs from 'node:fs';
import path from 'node:path';

import { chromium } from '@playwright/test';

import { extractFirstLink, waitForLastEmail } from '../../../stack/helpers/mailpit';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('e2e/visuel/resultats/lot-a-public');

async function main(): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  const width = process.argv.includes('--mobile') ? 375 : 1440;
  const suffix = width === 1440 ? '' : `-${width}`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ baseURL: BASE, viewport: { width, height: 900 }, locale: 'fr-FR' });
  const page = await ctx.newPage();
  const email = `lota+${Date.now()}@test.jangubi.sn`;
  const password = `Lot-A-${Math.random().toString(36).slice(2, 10)}!9`;

  await page.goto(BASE + '/inscription');
  await page.waitForURL(/\/realms\/jangubi\//, { timeout: 20_000 });
  await page.getByLabel(/prénom/i).fill('Marie');
  await page.locator('#lastName').fill('Visuel');
  await page.getByLabel(/adresse e-mail/i).fill(email);
  const phone = page.getByLabel(/^téléphone/i);
  if (await phone.count()) await phone.fill('771234567');
  await page.getByLabel(/^mot de passe/i).fill(password);
  await page.getByLabel(/confirmer le mot de passe/i).fill(password);
  await page.getByRole('button', { name: /continuer/i }).click();
  const link = extractFirstLink(await waitForLastEmail(email, { timeoutMs: 20_000 }));
  await page.goto(link);
  await page.waitForURL(/\/bienvenue/, { timeout: 30_000 });

  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const name = scheme === 'light' ? 'clair' : 'sombre';
    await page.goto(BASE + '/bienvenue');
    await page.getByLabel(/rechercher une paroisse/i).waitFor();
    await page.getByRole('radio', { name: /saint-dominique/i }).click();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `Inscription-Paroisse-${name}${suffix}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('heading', { name: 'Avant de terminer' }).waitFor();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `Inscription-Consentement-${name}${suffix}.png`), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`${name}${suffix}${overflow ? '  ⚠ défilement horizontal' : ''}`);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
