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

/**
 * Données de démonstration injectées (réseau intercepté, rien n'est écrit en base) : la paroisse de
 * démo n'a aucun événement, or la grille de l'agenda doit être vérifiée remplie.
 */
const DEMO_EVENTS = (node: string) => {
  const base = { description: '', node_id: node, node_name: 'Paroisse Saint-Dominique', place_id: null, max_participants: null, registration_closes_at: null, registrations_count: 0, seats_taken: 0, seats_remaining: null, is_full: false, is_cancelled: false };
  const ev = (id: number, title: string, start: string, end: string, extra: Record<string, unknown> = {}) => ({ ...base, id, title, start_at: start, end_at: end, event_type: 'other', location: 'Salle paroissiale', ...extra });
  return [
    ev(9001, 'Chorale', '2026-10-03T16:00:00+00:00', '2026-10-03T18:00:00+00:00'),
    ev(9002, 'Messe d’action de grâce pour la rentrée universitaire', '2026-10-04T09:30:00+00:00', '2026-10-04T10:30:00+00:00', { event_type: 'mass', location: 'Église' }),
    ev(9003, 'Verre de l’amitié', '2026-10-04T10:45:00+00:00', '2026-10-04T12:00:00+00:00', { location: 'Cour de la paroisse' }),
    ev(9004, 'Conseil pastoral', '2026-10-06T19:00:00+00:00', '2026-10-06T21:00:00+00:00'),
    ev(9005, 'Récollection des CEB', '2026-10-10T09:00:00+00:00', '2026-10-10T16:00:00+00:00', { event_type: 'retreat', max_participants: 60, seats_taken: 18, registrations_count: 12, seats_remaining: 42 }),
    ev(9006, 'Réunion des catéchistes', '2026-10-14T18:30:00+00:00', '2026-10-14T20:00:00+00:00'),
    ev(9007, 'Pèlerinage, réunion', '2026-10-16T19:00:00+00:00', '2026-10-16T20:30:00+00:00'),
    ev(9008, 'Rentrée du catéchisme', '2026-10-17T09:00:00+00:00', '2026-10-17T11:00:00+00:00'),
    ev(9009, 'Mariage Diatta – Coly', '2026-10-24T15:00:00+00:00', '2026-10-24T17:00:00+00:00', { event_type: 'mass', location: 'Église' }),
  ];
};

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
  const screens: Array<[string, string | null, string?]> = [
    ['PAR-Annonces', `${e}/annonces`],
    ['PAR-Annonce-Editeur', `${e}/annonces/nouvelle`],
    ['PAR-Annonce-Detail', annonce],
    ['PAR-Annonce-Feuille', `${e}/annonces/feuille`],
    ['PAR-Horaires', `${e}/horaires`],
    ['PAR-Horaires-Dialogue', `${e}/horaires`, 'Ajouter un horaire'],
    ['PAR-Agenda', `${e}/agenda`],
    ['PAR-Agenda-Octobre', `${e}/agenda?vue=mois&date=2026-10-04`],
    ['PAR-Agenda-Semaine', `${e}/agenda?vue=semaine`],
    ['PAR-Equipe', `${e}/equipe`],
    ['PAR-Parametres', `${e}/parametres`],
  ];

  const widths = mobile ? [375] : [1440];
  for (const width of widths) {
    for (const scheme of schemes) {
      const ctx = await browser.newContext({ baseURL: BASE, storageState: STATE, viewport: { width, height: 900 }, colorScheme: scheme, locale: 'fr-FR' });
      const page = await ctx.newPage();
      if (process.argv.includes('--demo-agenda')) {
        await page.route(/\/staff\/agenda\/\?/, (route) =>
          route.fulfill({ json: { count: DEMO_EVENTS(node).length, next: null, previous: null, results: DEMO_EVENTS(node) } }),
        );
      }
      for (const [name, url, click] of screens) {
        if (filter && !name.includes(filter)) continue;
        if (!url) continue;
        // Les autres lots modifient le dépôt en parallèle : on attend la fin d'une erreur de compilation passagère.
        for (let attempt = 0; attempt < 12; attempt += 1) {
          await page.goto(BASE + url);
          await page.waitForLoadState('networkidle').catch(() => undefined);
          await page.waitForTimeout(800);
          const broken = await page.locator('text=/Build Error|Runtime Error/').count();
          if (!broken) break;
          console.warn(`  (erreur de compilation d'un autre lot sur ${name}, nouvel essai)`);
          await page.waitForTimeout(10_000);
        }
        if (click) {
          await page.locator('button', { hasText: click }).first().click();
          await page.waitForTimeout(600);
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
