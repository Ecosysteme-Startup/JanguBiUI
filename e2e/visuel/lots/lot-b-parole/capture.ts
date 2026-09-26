/**
 * Lot B (Parole) : captures mobiles et contrôle de débordement horizontal.
 *
 *   KC_DEMO_PASSWORD=… npx tsx e2e/visuel/lots/lot-b-parole/capture.ts
 *
 * Pour chaque écran : 375 px (clair), 320 px avec texte à 200 % ; la largeur défilable du document
 * est comparée à celle de la fenêtre (aucun défilement horizontal attendu).
 */
import path from 'node:path';

import { chromium } from '@playwright/test';

import { BASE_URL, RESULTATS, sessionOf, settle } from '../../lib';

const ROUTES = [
  ['accueil', '/app'],
  ['parole', '/app/parole'],
  ['bible', '/app/bible'],
  ['bible-chapitre', '/app/bible/psaumes/119'],
  ['chapelet', '/app/chapelet'],
] as const;

const CASES = [
  { nom: '375', width: 375, zoom: '100%' },
  { nom: '320-200', width: 320, zoom: '200%' },
  { nom: '1024', width: 1024, zoom: '100%' },
] as const;

const browser = await chromium.launch();
const storageState = await sessionOf(browser, 'fidele');
let failures = 0;
for (const c of CASES) {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: 'fr-FR', viewport: { width: c.width, height: 800 }, storageState });
  const page = await context.newPage();
  for (const [nom, route] of ROUTES) {
    await page.goto(route);
    await settle(page);
    // Une page blanche (erreur de compilation ailleurs) ne vaut pas un « OK ».
    if (!(await page.locator('main h1').first().waitFor({ timeout: 20_000 }).then(() => true).catch(() => false))) {
      failures += 1;
      console.log(`${nom} @${c.nom} : PAGE NON RENDUE`);
      continue;
    }
    await page.evaluate((zoom) => {
      document.documentElement.style.fontSize = zoom;
    }, c.zoom);
    await page.waitForTimeout(300);
    const { scroll, client, culprits } = await page.evaluate(() => {
      const client = document.documentElement.clientWidth;
      const culprits = [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > client + 1)
        .filter((el) => {
          // Un élément dans une zone à défilement horizontal propre ne déborde pas de la page.
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const o = getComputedStyle(p).overflowX;
            if (o === 'auto' || o === 'scroll' || o === 'hidden') return false;
          }
          return !el.closest('.sr-only') && !el.classList.contains('sr-only');
        })
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
      const widest = [...document.querySelectorAll('body *')]
        .map((el) => ({ el, right: el.getBoundingClientRect().right }))
        .filter(({ right }) => right > client && right <= document.documentElement.scrollWidth + 1)
        .sort((a, b) => b.right - a.right)
        .slice(0, 3)
        .map(({ el, right }) => `${Math.round(right)} ${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`);
      return { scroll: document.documentElement.scrollWidth, client, culprits: culprits.length ? culprits : widest };
    });
    const ok = scroll <= client;
    if (!ok) failures += 1;
    console.log(`${nom} @${c.nom} : ${ok ? 'OK' : `DÉBORDE de ${scroll - client} px`}${ok ? '' : ` — ${culprits.join(' | ')}`}`);
    await page.screenshot({ path: path.join(RESULTATS, 'lot-b-parole', `${nom}-${c.nom}.png`), fullPage: true });
  }
  await context.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
