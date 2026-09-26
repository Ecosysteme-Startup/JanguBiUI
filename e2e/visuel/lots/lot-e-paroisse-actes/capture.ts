/**
 * Captures du lot E (espace paroisse : tableau de bord, demandes, détail, confessions) sur la pile réelle.
 * Usage : KC_DEMO_PASSWORD=… npx tsx e2e/visuel/lots/lot-e-paroisse-actes/capture.ts [filtre] [--mobile] [--both]
 * Sortie : e2e/visuel/resultats/lot-e-paroisse-actes/<écran>-<clair|sombre>[-375].png
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type Page } from '@playwright/test';
import { KC_DEMO_PASSWORD, loginViaKeycloak } from '../../../stack/helpers/auth';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('e2e/visuel/resultats/lot-e-paroisse-actes');
const STATE = path.join(OUT, '.state.json');
const EMAIL = 'admin_paroissial@demo.jangubi.sn';

async function ensureState(browser: Browser): Promise<void> {
  if (fs.existsSync(STATE) && Date.now() - fs.statSync(STATE).mtimeMs < 20 * 60_000) return;
  const ctx = await browser.newContext({ baseURL: BASE, locale: 'fr-FR' });
  const page = await ctx.newPage();
  await loginViaKeycloak(page, EMAIL, KC_DEMO_PASSWORD, { entryPath: '/espace' });
  await page.waitForURL(/localhost:3000\/espace\/[^/]+/, { timeout: 30_000 });
  await ctx.storageState({ path: STATE });
  await ctx.close();
}

async function probe(page: Page): Promise<{ node: string; demande: string | null }> {
  let node = process.env.LOT_E_NODE ?? '';
  if (!node) {
    await page.goto(`${BASE}/espace`);
    await page.waitForURL(/\/espace\/[^/]+/, { timeout: 90_000 });
    node = new URL(page.url()).pathname.split('/')[2];
  }
  await page.goto(`${BASE}/espace/${node}/demandes`);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(1500);
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''));
  const demande = hrefs.find((h) => /\/demandes\/[^/?]+$/.test(h)) ?? null;
  return { node, demande };
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  const filter = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? '';
  const widths = process.argv.includes('--both') ? [1440, 375] : process.argv.includes('--mobile') ? [375] : [1440];
  const browser = await chromium.launch();
  await ensureState(browser);

  const pctx = await browser.newContext({ baseURL: BASE, storageState: STATE });
  const { node, demande } = await probe(await pctx.newPage());
  await pctx.close();

  const screens: Array<[string, string | null]> = [
    ['PAR-Tableau-de-bord', `/espace/${node}`],
    ['PAR-Demandes', `/espace/${node}/demandes`],
    ['PAR-Demande-Detail', demande],
    ['PAR-Confessions', `/espace/${node}/confessions`],
  ];

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
        await page.waitForTimeout(800);
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
