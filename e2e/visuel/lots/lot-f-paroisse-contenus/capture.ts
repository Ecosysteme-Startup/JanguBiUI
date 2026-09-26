/**
 * Captures du lot F (espace paroisse : annonces, horaires, agenda, équipe, paramètres) sur la pile réelle.
 * Usage : KC_DEMO_PASSWORD=… npx tsx e2e/visuel/lots/lot-f-paroisse-contenus/capture.ts [filtre] [--mobile] [--light|--dark]
 * Sortie : e2e/visuel/resultats/lot-f-paroisse-contenus/<écran>-<clair|sombre>[-375].png
 */
import fs from 'node:fs';
import path from 'node:path';

import { chromium, type Browser, type Page } from '@playwright/test';

import { KC_DEMO_PASSWORD, loginViaKeycloak } from '../../../stack/helpers/auth';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('e2e/visuel/resultats/lot-f-paroisse-contenus');
const STATE = path.join(OUT, '.state.json');
const EMAIL = 'cure@demo.jangubi.sn';

async function ensureState(browser: Browser): Promise<void> {
  if (fs.existsSync(STATE) && Date.now() - fs.statSync(STATE).mtimeMs < 20 * 60_000) return;
  const ctx = await browser.newContext({ baseURL: BASE, locale: 'fr-FR' });
  const page = await ctx.newPage();
  await loginViaKeycloak(page, EMAIL, KC_DEMO_PASSWORD, { entryPath: '/espace' });
  await page.waitForURL(/localhost:3000\//);
  await ctx.storageState({ path: STATE });
  await ctx.close();
}

async function nodeIdOf(page: Page): Promise<string> {
  if (process.env.NODE_ID) return process.env.NODE_ID;
  await page.goto(BASE + '/espace');
  await page.waitForURL(/\/espace\/[^/]+/, { timeout: 20_000 }).catch(() => undefined);
  const m = /\/espace\/([^/?#]+)/.exec(page.url());
  if (m) return m[1];
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''));
  const h = hrefs.find((x) => /^\/espace\/[^/]+/.test(x));
  if (!h) throw new Error('nœud introuvable');
  return /^\/espace\/([^/?#]+)/.exec(h)![1];
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
  const schemes = process.argv.includes('--light') ? (['light'] as const) : process.argv.includes('--dark') ? (['dark'] as const) : (['light', 'dark'] as const);
  const browser = await chromium.launch();
  await ensureState(browser);

  const probe = await browser.newContext({ baseURL: BASE, storageState: STATE });
  const pp = await probe.newPage();
  const node = await nodeIdOf(pp);
  const annonce = filter && !'PAR-Annonce-Detail'.includes(filter) ? null : await firstHref(pp, `/espace/${node}/annonces`, /\/annonces\/(?!nouvelle|feuille)[^/?]+$/);
  await probe.close();
  console.log('nœud', node);

  const e = `/espace/${node}`;
  const screens: Array<[string, string | null]> = [
    ['PAR-Annonces', `${e}/annonces`],
    ['PAR-Annonce-Editeur', `${e}/annonces/nouvelle`],
    ['PAR-Annonce-Detail', annonce],
    ['PAR-Annonce-Feuille', `${e}/annonces/feuille`],
    ['PAR-Horaires', `${e}/horaires`],
    ['PAR-Agenda', `${e}/agenda`],
    ['PAR-Agenda-Semaine', `${e}/agenda?vue=semaine`],
    ['PAR-Equipe', `${e}/equipe`],
    ['PAR-Parametres', `${e}/parametres`],
  ];

  const widths = mobile ? [375] : [1440];
  for (const width of widths) {
    for (const scheme of schemes) {
      const ctx = await browser.newContext({ baseURL: BASE, storageState: STATE, viewport: { width, height: 900 }, colorScheme: scheme, locale: 'fr-FR' });
      const page = await ctx.newPage();
      for (const [name, url] of screens) {
        if (filter && !name.includes(filter)) continue;
        if (!url) continue;
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
