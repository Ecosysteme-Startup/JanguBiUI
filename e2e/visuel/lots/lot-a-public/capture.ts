/**
 * Captures du lot A (site public) sur la pile réelle, en visiteur anonyme.
 * Usage : npx tsx e2e/visuel/lots/lot-a-public/capture.ts [filtre] [--mobile] [--sombre|--clair]
 * Sortie : e2e/visuel/resultats/lot-a-public/<écran>-<clair|sombre>[-375].png
 * Les écrans de /bienvenue (compte jetable) sont capturés par bienvenue.ts.
 */
import fs from 'node:fs';
import path from 'node:path';

import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('e2e/visuel/resultats/lot-a-public');

const SCREENS: Array<[string, string]> = [
  ['Accueil', '/'],
  ['Parole-du-jour', '/parole'],
  ['Paroisses', '/paroisses'],
  ['Fiche-Paroisse', '/paroisses/DAK-SAINT-DOMINIQUE'],
  ['Pour-les-paroisses', '/pour-les-paroisses'],
  ['Conditions', '/conditions'],
  ['Confidentialite', '/confidentialite'],
  ['Connexion-erreur', '/connexion/erreur?error=Configuration'],
];

async function main(): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  const args = process.argv.slice(2);
  const filter = args.find((a) => !a.startsWith('--')) ?? '';
  const widths = args.includes('--mobile') ? [375] : [1440];
  const schemes = args.includes('--sombre') ? (['dark'] as const) : args.includes('--clair') ? (['light'] as const) : (['light', 'dark'] as const);
  const browser = await chromium.launch();
  for (const width of widths) {
    for (const scheme of schemes) {
      const ctx = await browser.newContext({ baseURL: BASE, viewport: { width, height: 900 }, colorScheme: scheme, locale: 'fr-FR' });
      const page = await ctx.newPage();
      for (const [name, url] of SCREENS) {
        if (filter && !name.includes(filter)) continue;
        for (let attempt = 0; attempt < 30; attempt += 1) {
          await page.goto(BASE + url);
          await page.waitForLoadState('networkidle').catch(() => undefined);
          await page.waitForTimeout(800);
          const broken = await page.evaluate(() =>
            /Build Error|Module not found/.test(document.querySelector('nextjs-portal')?.shadowRoot?.textContent ?? ''),
          );
          if (!broken) break;
          console.warn(`(compilation cassée, nouvel essai dans 10 s : ${name})`);
          await page.waitForTimeout(10_000);
        }
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
