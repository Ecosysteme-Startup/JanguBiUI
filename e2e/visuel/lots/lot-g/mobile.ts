/**
 * Lot G : contrôle à 375 px (défilement horizontal) des écrans diocèse et plateforme,
 * avec les sessions du harnais partagé (e2e/visuel/.auth/<compte>.json, créées par capture.ts).
 * Usage : DIO_NODE=<uuid> npx tsx e2e/visuel/lots/lot-g/mobile.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('e2e/visuel/resultats/lot-g');
const node = process.env.DIO_NODE ?? '';
const screens: Array<[string, string, string]> = [
  ['chancelier', 'DIO-Tableau-de-bord', `/espace/${node}`],
  ['chancelier', 'DIO-Structure', `/espace/${node}/structure`],
  ['chancelier', 'DIO-Nominations', `/espace/${node}/nominations`],
  ['chancelier', 'DIO-Clerge', `/espace/${node}/clerge`],
  ['plateforme', 'PLA-Tableau-de-bord', '/plateforme'],
  ['plateforme', 'PLA-Referentiels', '/plateforme/referentiels?onglet=capacites'],
  ['plateforme', 'PLA-Comptes', '/plateforme/comptes'],
  ['plateforme', 'PLA-Audit', '/plateforme/audit'],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [compte, name, url] of screens) {
    const ctx = await browser.newContext({
      storageState: path.resolve(`e2e/visuel/.auth/${compte}.json`),
      viewport: { width: 375, height: 812 },
    });
    const page = await ctx.newPage();
    await page.goto(BASE + url);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: path.join(OUT, `${name}-375.png`), fullPage: true });
    console.log(`${name} ${overflow > 0 ? `déborde de ${overflow} px` : 'OK'}`);
    await ctx.close();
  }
  await browser.close();
})();
