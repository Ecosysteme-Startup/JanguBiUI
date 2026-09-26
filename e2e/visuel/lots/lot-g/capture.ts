/**
 * Captures du lot G (espace diocèse et plateforme) sur la pile réelle.
 * Usage : KC_DEMO_PASSWORD=… npx tsx e2e/visuel/lots/lot-g/capture.ts [filtre] [--mobile] [--dio|--pla]
 * Sortie : e2e/visuel/resultats/lot-g/<écran>-<clair|sombre>[-375].png
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser } from '@playwright/test';
import { KC_DEMO_PASSWORD, loginViaKeycloak } from '../../../stack/helpers/auth';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('e2e/visuel/resultats/lot-g');

const ACCOUNTS = {
  dio: { email: 'chancelier@demo.jangubi.sn', entry: '/espace' },
  pla: { email: 'plateforme@demo.jangubi.sn', entry: '/plateforme' },
} as const;
type Who = keyof typeof ACCOUNTS;

const stateOf = (who: Who) => path.join(OUT, `.state-${who}.json`);

async function ensureState(browser: Browser, who: Who): Promise<void> {
  const file = stateOf(who);
  if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 20 * 60_000) return;
  const ctx = await browser.newContext({ baseURL: BASE, locale: 'fr-FR' });
  const page = await ctx.newPage();
  await loginViaKeycloak(page, ACCOUNTS[who].email, KC_DEMO_PASSWORD, { entryPath: ACCOUNTS[who].entry });
  await page.waitForURL(/localhost:3000\//);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await ctx.storageState({ path: file });
  await ctx.close();
}

async function dioceseNode(browser: Browser): Promise<string> {
  if (process.env.DIO_NODE) return process.env.DIO_NODE;
  const ctx = await browser.newContext({ baseURL: BASE, storageState: stateOf('dio') });
  const page = await ctx.newPage();
  await page.goto(BASE + '/espace');
  await page.waitForURL(/\/espace\/[^/]+/, { timeout: 20_000 }).catch(() => undefined);
  let m = page.url().match(/\/espace\/([^/?#]+)/);
  if (!m) {
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''));
    const h = hrefs.find((x) => /^\/espace\/[^/]+$/.test(x));
    m = h ? h.match(/\/espace\/([^/?#]+)/) : null;
  }
  await ctx.close();
  if (!m) throw new Error('nœud diocèse introuvable');
  return m[1];
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  const args = process.argv.slice(2);
  const filter = args.find((a) => !a.startsWith('--')) ?? '';
  const mobile = args.includes('--mobile');
  const only: Who[] = args.includes('--dio') ? ['dio'] : args.includes('--pla') ? ['pla'] : ['dio', 'pla'];
  const browser = await chromium.launch();

  for (const who of only) {
    await ensureState(browser, who);
    let screens: Array<[string, string]>;
    if (who === 'dio') {
      const node = await dioceseNode(browser);
      screens = [
        ['DIO-Tableau-de-bord', `/espace/${node}`],
        ['DIO-Structure', `/espace/${node}/structure`],
        ['DIO-Nominations', `/espace/${node}/nominations`],
        ['DIO-Clerge', `/espace/${node}/clerge`],
        ['DIO-Audit', `/espace/${node}/audit`],
      ];
    } else {
      screens = [
        ['PLA-Tableau-de-bord', '/plateforme'],
        ['PLA-Referentiels', '/plateforme/referentiels'],
        ['PLA-Comptes', '/plateforme/comptes'],
        ['PLA-Audit', '/plateforme/audit'],
      ];
    }
    const widths = mobile ? [375] : [1440];
    for (const width of widths) {
      for (const scheme of ['light', 'dark'] as const) {
        const ctx = await browser.newContext({
          baseURL: BASE,
          storageState: stateOf(who),
          viewport: { width, height: 900 },
          colorScheme: scheme,
          locale: 'fr-FR',
        });
        const page = await ctx.newPage();
        for (const [name, url] of screens) {
          if (filter && !name.includes(filter)) continue;
          // Un autre lot peut casser la compilation un instant : on réessaie plutôt que de capturer l'erreur.
          for (let attempt = 0; attempt < 12; attempt += 1) {
            await page.goto(BASE + url);
            await page.waitForLoadState('networkidle').catch(() => undefined);
            await page.waitForTimeout(800);
            const broken = (await page.locator('h1').count()) === 0;
            if (!broken) break;
            console.warn(`(compilation cassée ailleurs, nouvel essai dans 10 s : ${name})`);
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
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
