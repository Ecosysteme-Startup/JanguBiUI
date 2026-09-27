/**
 * Harnais de comparaison visuelle « app ↔ maquette Ciel produit ».
 * Utilisé par visuel.spec.ts (Playwright) et par capture.ts (CLI tsx). Voir README.md.
 *
 * Pour chaque écran : capture de l'app (1440 × 900, pleine page) en clair et en sombre, copie de la
 * capture de référence (docs/v1/maquettes-ciel/captures/<maquette>.png et Sombre-<maquette>.png) et
 * planche comparative « App | Maquette | Différences » avec le taux de pixels différents.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Browser, BrowserContext, Page } from '@playwright/test';

import { KC_DEMO_PASSWORD, loginViaKeycloak } from '../stack/helpers/auth';

import { type Compte, COMPTES, type Ecran } from './ecrans';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const BASE_URL = process.env.VISUEL_BASE_URL ?? 'http://localhost:3000';
export const ROOT = path.resolve(HERE, '../..');
export const MAQUETTES = path.join(ROOT, 'docs/v1/maquettes-ciel/captures');
export const RESULTATS = path.join(HERE, 'resultats');
const AUTH_DIR = path.join(HERE, '.auth');
const SESSION_TTL_MS = 20 * 60_000;

export type Theme = 'clair' | 'sombre';
export const VIEWPORT = { width: 1440, height: 900 };

/* ------------------------------------------------------------------ sessions */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Verrou fichier par compte : Keycloak refuse de réutiliser un code TOTP dans la même fenêtre de
 * 30 s et bloque après 3 échecs. Deux harnais (ou deux agents) ne se connectent jamais en même temps
 * sur le même compte ; le second attend puis réutilise la session enregistrée par le premier.
 */
async function withLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const lock = path.join(AUTH_DIR, `${name}.lock`);
  const started = Date.now();
  for (;;) {
    try {
      fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
      break;
    } catch {
      const age = Date.now() - (fs.statSync(lock, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
      if (age > 120_000) fs.rmSync(lock, { force: true });
      if (Date.now() - started > 180_000) throw new Error(`Verrou de connexion bloqué : ${lock}`);
      await sleep(1_000);
    }
  }
  try {
    return await fn();
  } finally {
    fs.rmSync(lock, { force: true });
  }
}

const statePath = (compte: Compte) => path.join(AUTH_DIR, `${compte}.json`);

const freshState = (compte: Compte) => {
  const file = statePath(compte);
  const stat = fs.statSync(file, { throwIfNoEntry: false });
  return stat && Date.now() - stat.mtimeMs < SESSION_TTL_MS ? file : undefined;
};

/** Session enregistrée (storageState) du compte, créée par une connexion Keycloak réelle si besoin. */
export async function sessionOf(browser: Browser, compte: Compte): Promise<string | undefined> {
  if (compte === 'public') return undefined;
  const cached = freshState(compte);
  if (cached) return cached;
  if (!KC_DEMO_PASSWORD) throw new Error('KC_DEMO_PASSWORD absent : exporter la variable (voir e2e/visuel/README.md).');
  return withLock(compte, async () => {
    const again = freshState(compte);
    if (again) return again;
    const { email, entry } = COMPTES[compte];
    const context = await browser.newContext({ baseURL: BASE_URL, locale: 'fr-FR', viewport: VIEWPORT });
    const page = await context.newPage();
    await loginViaKeycloak(page, email, KC_DEMO_PASSWORD, { entryPath: entry });
    await page.waitForURL((url) => url.href.startsWith(BASE_URL), { timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await context.storageState({ path: statePath(compte) });
    await context.close();
    return statePath(compte);
  });
}

/* ------------------------------------------------------------ routes à trous */

const resolved = new Map<string, string>();

/**
 * Remplace les trous de la route : `{node}` = premier espace du compte (redirection de /espace),
 * `{x}` = premier lien de la page `trous.x.depuis` dont l'URL correspond à `trous.x.motif`.
 * Les valeurs peuvent être fixées par variable d'environnement : VISUEL_NODE, VISUEL_DEMANDE…
 */
export async function resolveRoute(page: Page, ecran: Ecran): Promise<string> {
  let route = ecran.route;
  for (const [, name] of ecran.route.matchAll(/\{(\w+)\}/g)) {
    const key = `${ecran.compte}:${name}`;
    const fromEnv = process.env[`VISUEL_${name.toUpperCase()}`];
    if (fromEnv) resolved.set(key, fromEnv);
    if (!resolved.has(key)) {
      if (name === 'node') {
        await page.goto(`${BASE_URL}/espace`);
        await page.waitForURL(/\/espace\/[^/?#]+/, { timeout: 30_000 });
        resolved.set(key, page.url().match(/\/espace\/([^/?#]+)/)![1]);
      } else {
        const trou = ecran.trous?.[name];
        if (!trou) throw new Error(`Trou {${name}} sans règle de résolution pour ${ecran.maquette}`);
        await page.goto(`${BASE_URL}${trou.depuis.replace('{node}', resolved.get(`${ecran.compte}:node`) ?? '')}`);
        await page.waitForLoadState('networkidle').catch(() => undefined);
        const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''));
        const hit = hrefs.map((h) => h.match(new RegExp(trou.motif))).find(Boolean);
        if (!hit) throw new Error(`Aucun lien ${trou.motif} sur ${trou.depuis} pour ${ecran.maquette}`);
        resolved.set(key, hit[1]);
      }
    }
    route = route.replace(`{${name}}`, resolved.get(key)!);
  }
  return route;
}

/* ------------------------------------------------------------------ captures */

/** Force le thème de next-themes (localStorage « theme ») et la préférence système. */
export async function applyTheme(context: BrowserContext, page: Page, theme: Theme) {
  const value = theme === 'sombre' ? 'dark' : 'light';
  await context.addInitScript((v) => {
    try {
      window.localStorage.setItem('theme', v);
    } catch {
      /* stockage indisponible : la préférence système émulée suffit */
    }
  }, value);
  await page.emulateMedia({ colorScheme: value, reducedMotion: 'reduce' });
}

/** Attend un écran stable : réseau calme, polices chargées, squelettes disparus. */
export async function settle(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  // Indicateur du serveur de dev Next (bouton « N ») : absent de la maquette.
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => undefined);
  await page.evaluate(() => document.fonts.ready);
  await page
    .waitForFunction(() => !document.querySelector('.animate-pulse, [aria-busy="true"]'), undefined, { timeout: 8_000 })
    .catch(() => undefined);
  await page.waitForTimeout(300);
}

export const outDir = (ecran: Ecran) => path.join(RESULTATS, ecran.nom ?? ecran.maquette);

export const referenceOf = (maquette: string, theme: Theme) =>
  path.join(MAQUETTES, `${theme === 'sombre' ? 'Sombre-' : ''}${maquette}.png`);

/** Capture l'écran de l'app dans un thème ; renvoie le chemin du PNG. */
export async function captureApp(browser: Browser, ecran: Ecran, theme: Theme): Promise<string> {
  const storageState = await sessionOf(browser, ecran.compte);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: 'fr-FR', viewport: ecran.viewport ?? VIEWPORT, storageState });
  const page = await context.newPage();
  await applyTheme(context, page, theme);
  const route = await resolveRoute(page, ecran);
  await page.goto(`${BASE_URL}${route}`);
  await settle(page);
  if (ecran.avant) await ecran.avant(page);
  const dir = outDir(ecran);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `app-${theme}.png`);
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled', caret: 'hide' });
  await context.close();
  return file;
}

/**
 * Planche comparative : App | Maquette | Différences (pixels dont un canal diffère de plus de 24),
 * avec le taux de différence en titre. Calculée dans Chromium (canvas), sans dépendance d'image.
 */
export async function compose(browser: Browser, ecran: Ecran, theme: Theme, appPng: string): Promise<{ file: string; ratio: number | null }> {
  const dir = outDir(ecran);
  const ref = referenceOf(ecran.maquette, theme);
  const hasRef = fs.existsSync(ref);
  if (hasRef) fs.copyFileSync(ref, path.join(dir, `maquette-${theme}.png`));
  const toData = (f: string) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
  const page = await browser.newPage({ viewport: { width: 1440 * 3 + 80, height: 900 } });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#888;font:14px system-ui;color:#fff">
    <div id="t" style="padding:12px 20px;font-weight:600"></div>
    <div style="display:flex;gap:20px;padding:0 20px 20px;align-items:flex-start">
      <figure style="margin:0"><figcaption>App (${theme})</figcaption><img id="a" src="${toData(appPng)}"></figure>
      <figure style="margin:0"><figcaption>Maquette ${hasRef ? '' : '(absente)'}</figcaption>${hasRef ? `<img id="b" src="${toData(ref)}">` : ''}</figure>
      <figure style="margin:0"><figcaption>Différences (rouge)</figcaption><canvas id="d"></canvas></figure>
    </div></body></html>`);
  // tsx/esbuild (keepNames) enveloppe les fonctions nommées dans __name : on le fournit à la page.
  await page.evaluate('window.__name = (f) => f');
  const ratio = await page.evaluate(async (label) => {
    const a = document.getElementById('a') as HTMLImageElement;
    const b = document.getElementById('b') as HTMLImageElement | null;
    await Promise.all([a, b].filter(Boolean).map((img) => (img!.complete ? null : new Promise((r) => (img!.onload = r)))));
    const t = document.getElementById('t')!;
    if (!b) {
      t.textContent = `${label} — pas de capture de référence`;
      return null;
    }
    const w = Math.max(a.naturalWidth, b.naturalWidth);
    const h = Math.max(a.naturalHeight, b.naturalHeight);
    const draw = (img: HTMLImageElement) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, w, h);
    };
    const da = draw(a);
    const db = draw(b);
    const d = document.getElementById('d') as HTMLCanvasElement;
    d.width = w;
    d.height = h;
    const dctx = d.getContext('2d')!;
    const out = dctx.createImageData(w, h);
    let diff = 0;
    for (let i = 0; i < da.data.length; i += 4) {
      const delta = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
      const gray = (db.data[i] + db.data[i + 1] + db.data[i + 2]) / 3;
      if (delta > 24) {
        diff += 1;
        out.data.set([230, 30, 30, 255], i);
      } else {
        out.data.set([gray, gray, gray, 90], i);
      }
    }
    dctx.putImageData(out, 0, 0);
    const r = diff / (w * h);
    t.textContent = `${label} — ${(r * 100).toFixed(1)} % de pixels différents · app ${a.naturalWidth}×${a.naturalHeight} · maquette ${b.naturalWidth}×${b.naturalHeight}`;
    return r;
  }, `${ecran.nom ?? ecran.maquette} (${theme})`);
  const file = path.join(dir, `comparaison-${theme}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
  return { file, ratio };
}

/** Capture + planche pour chaque thème demandé ; écrit resultats/<écran>/rapport.json. */
export async function compare(browser: Browser, ecran: Ecran, themes: Theme[] = ['clair', 'sombre']) {
  const rapport: Record<string, unknown> = { maquette: ecran.maquette, route: ecran.route, compte: ecran.compte, date: new Date().toISOString() };
  for (const theme of themes) {
    const app = await captureApp(browser, ecran, theme);
    const { file, ratio } = await compose(browser, ecran, theme, app);
    rapport[theme] = { app: path.relative(ROOT, app), comparaison: path.relative(ROOT, file), differences: ratio };
  }
  fs.writeFileSync(path.join(outDir(ecran), 'rapport.json'), `${JSON.stringify(rapport, null, 2)}\n`);
  return rapport;
}
