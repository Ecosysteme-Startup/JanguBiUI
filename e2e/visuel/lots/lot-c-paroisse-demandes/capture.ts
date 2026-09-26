/**
 * Captures du lot C (paroisse, notifications, demandes d'actes) sur la pile réelle.
 * Usage : KC_DEMO_PASSWORD=… npx tsx e2e/visuel/lots/lot-c-paroisse-demandes/capture.ts [filtre] [--mobile]
 * Sortie : e2e/visuel/resultats/lot-c-paroisse-demandes/<écran>-<clair|sombre>[-375].png
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type Page } from '@playwright/test';
import { KC_DEMO_PASSWORD, loginViaKeycloak } from '../../../stack/helpers/auth';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('e2e/visuel/resultats/lot-c-paroisse-demandes');
const STATE = path.join(OUT, '.state.json');
const EMAIL = 'fidele2@demo.jangubi.sn';

async function ensureState(browser: Browser): Promise<void> {
  if (fs.existsSync(STATE) && Date.now() - fs.statSync(STATE).mtimeMs < 20 * 60_000) return;
  const ctx = await browser.newContext({ baseURL: BASE, locale: 'fr-FR' });
  const page = await ctx.newPage();
  await loginViaKeycloak(page, EMAIL, KC_DEMO_PASSWORD, { entryPath: '/app' });
  await page.waitForURL(/localhost:3000\/app/);
  await ctx.storageState({ path: STATE });
  await ctx.close();
}

async function firstHref(page: Page, url: string, pattern: RegExp): Promise<string | null> {
  await page.goto(BASE + url);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''));
  return hrefs.find((h) => pattern.test(h)) ?? null;
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  const filter = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? '';
  const mobile = process.argv.includes('--mobile');
  const browser = await chromium.launch();
  await ensureState(browser);

  const probe = await browser.newContext({ baseURL: BASE, storageState: STATE });
  const pp = await probe.newPage();
  const annonce = await firstHref(pp, '/app/paroisse', /\/app\/paroisse\/annonces\/[^/]+$/);
  const evenement = await firstHref(pp, '/app/paroisse', /\/app\/paroisse\/evenements\/[^/]+$/);
  const demande = await firstHref(pp, '/app/demandes', /\/app\/demandes\/(?!nouvelle)[^/]+$/);
  await probe.close();

  const screens: Array<[string, string | null]> = [
    ['FID-Ma-Paroisse', '/app/paroisse'],
    ['FID-Annonce', annonce],
    ['FID-Evenement', evenement],
    ['FID-Notifications', '/app/notifications'],
    ['FID-Demandes', '/app/demandes'],
    ['FID-Demande-Nouvelle', '/app/demandes/nouvelle'],
    ['FID-Demande-Suivi', demande],
  ];

  const widths = mobile ? [375] : [1440];
  for (const width of widths) {
    for (const scheme of ['light', 'dark'] as const) {
      const ctx = await browser.newContext({
        baseURL: BASE,
        storageState: STATE,
        viewport: { width, height: 900 },
        colorScheme: scheme,
        locale: 'fr-FR',
      });
      const page = await ctx.newPage();
      for (const [name, url] of screens) {
        if (filter && !name.includes(filter)) continue;
        if (!url) {
          console.warn(`(aucune URL pour ${name})`);
          continue;
        }
        await page.goto(BASE + url);
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await page.waitForTimeout(600);
        const suffix = `${scheme === 'light' ? 'clair' : 'sombre'}${width === 1440 ? '' : `-${width}`}`;
        const file = path.join(OUT, `${name}-${suffix}.png`);
        await page.screenshot({ path: file, fullPage: true });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        console.log(`${file} ${url}${overflow ? '  ⚠ défilement horizontal' : ''}`);
      }
      await ctx.close();
    }
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
