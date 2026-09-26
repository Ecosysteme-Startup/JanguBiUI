import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { AUDIT_OUT } from '../playwright.audit.config';
import { measureLayout } from '../helpers/measure';
import { clientNav, settle, warmSession } from '../helpers/nav';
import { IDS, statePath } from '../helpers/screens';

/**
 * Recette 03 — `prefers-reduced-motion` et agrandissement du texte à 200 % (SC 2.3.3 bonnes
 * pratiques, 1.4.4, 1.4.10) sur 3 écrans représentatifs : public, formulaire fidèle, tableau BO.
 */
const CAPTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../docs/v1/recette/captures/03');
mkdirSync(`${AUDIT_OUT}/motion-zoom`, { recursive: true });

const SAMPLES = [
  { id: 'pub-accueil', persona: 'anonyme', path: '/' },
  { id: 'app-demande-nouvelle', persona: 'fidele', path: '/app/demandes/nouvelle' },
  { id: 'bo-demandes', persona: 'cure', path: `/espace/${IDS.paroisse}/demandes` },
] as const;

async function open(browser: Browser, s: (typeof SAMPLES)[number], width: number, reducedMotion: 'reduce' | 'no-preference'): Promise<Page> {
  const ctx = await browser.newContext({
    storageState: s.persona === 'anonyme' ? undefined : statePath(s.persona),
    viewport: { width, height: width < 768 ? 812 : 900 },
    reducedMotion,
    locale: 'fr-FR',
  });
  const page = await ctx.newPage();
  if (s.persona === 'anonyme') {
    await page.goto(s.path);
    await settle(page);
  } else {
    await warmSession(page);
    await clientNav(page, s.path);
  }
  return page;
}

/** Animations et transitions CSS/Web Animations actives, plus le comportement de défilement. */
async function motionSnapshot(page: Page) {
  return page.evaluate(() => {
    const anims = document.getAnimations().map((a) => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      const timing = a.effect?.getComputedTiming();
      return {
        name: (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? a.constructor.name,
        duration: Number(timing?.duration ?? 0),
        iterations: timing?.iterations,
        target: t ? `${t.tagName.toLowerCase()}.${(t.getAttribute('class') ?? '').split(' ').slice(0, 3).join('.')}` : '?',
      };
    });
    let longTransitions = 0;
    let longAnimations = 0;
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const cs = getComputedStyle(el);
      const td = Math.max(...cs.transitionDuration.split(',').map((x) => parseFloat(x) * (x.includes('ms') ? 0.001 : 1)));
      const ad = Math.max(...cs.animationDuration.split(',').map((x) => parseFloat(x) * (x.includes('ms') ? 0.001 : 1)));
      if (td > 0.05) longTransitions += 1;
      if (ad > 0.05 && cs.animationName !== 'none') longAnimations += 1;
    }
    return { running: anims.filter((a) => a.duration > 50), longTransitions, longAnimations, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };
  });
}

for (const s of SAMPLES) {
  test(`M — prefers-reduced-motion : ${s.id}`, async ({ browser }) => {
    const res: Record<string, unknown> = {};
    for (const mode of ['no-preference', 'reduce'] as const) {
      const page = await open(browser, s, 1440, mode);
      res[mode] = await motionSnapshot(page);
      // Interaction qui anime typiquement : survol / focus du premier bouton, puis ouverture du menu mobile.
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(300);
      const menu = page.getByRole('button', { name: /Ouvrir le menu|Menu/ }).first();
      if (await menu.isVisible().catch(() => false)) {
        await menu.click();
        await page.waitForTimeout(60);
        res[`${mode}-menu`] = await motionSnapshot(page);
      }
      await page.context().close();
    }
    writeFileSync(`${AUDIT_OUT}/motion-zoom/motion-${s.id}.json`, JSON.stringify(res, null, 2));
    const reduce = res.reduce as Awaited<ReturnType<typeof motionSnapshot>>;
    expect.soft(reduce.longAnimations, 'animations CSS actives malgré reduce').toBe(0);
    expect.soft(reduce.longTransitions, 'transitions > 50 ms malgré reduce').toBe(0);
    expect.soft(reduce.scrollBehavior, 'défilement doux malgré reduce').not.toBe('smooth');
  });

  test(`Z — texte 200 % : ${s.id}`, async ({ browser }) => {
    const res: Record<string, unknown> = {};
    for (const width of [1280, 375]) {
      const page = await open(browser, s, width, 'no-preference');
      const before = await page.evaluate(() => {
        const sizes = new Map<Element, number>();
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) if (n.parentElement && (n.textContent ?? '').trim()) sizes.set(n.parentElement, parseFloat(getComputedStyle(n.parentElement).fontSize));
        (window as unknown as { __sizes: Map<Element, number> }).__sizes = sizes;
        return sizes.size;
      });
      // Agrandissement du texte seul (réglage « taille de police » du navigateur) : racine à 200 %.
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await page.waitForTimeout(600);
      const notScaled = await page.evaluate(() => {
        const sizes = (window as unknown as { __sizes: Map<Element, number> }).__sizes;
        const out: string[] = [];
        sizes.forEach((before, el) => {
          if (!el.isConnected) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2) return;
          const after = parseFloat(getComputedStyle(el).fontSize);
          if (after < before * 1.5) out.push(`${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(' ').slice(0, 2).join('.')} « ${(el as HTMLElement).innerText.replace(/\s+/g, ' ').slice(0, 30)} » ${before}→${after}px`);
        });
        return [...new Set(out)];
      });
      const m = await measureLayout(page);
      await page.screenshot({ path: `${CAPTURES}/zoom200-${s.id}-${width}.jpg`, fullPage: true, type: 'jpeg', quality: 55 });
      res[`texte200@${width}`] = {
        textNodes: before,
        notScaledCount: notScaled.length,
        notScaled: notScaled.slice(0, 25),
        overflow: m.scrollWidth > m.clientWidth + 1,
        scrollWidth: m.scrollWidth,
        findings: m.findings.filter((f) => ['offscreen', 'truncated', 'overlap', 'masked-bottom'].includes(f.kind)),
      };
      await page.context().close();
    }
    // Zoom navigateur 200 % d'un écran de 1280 px = viewport CSS de 640 px (SC 1.4.4 / 1.4.10).
    const page = await open(browser, s, 640, 'no-preference');
    const m = await measureLayout(page);
    res['zoom200@1280(=640)'] = { overflow: m.scrollWidth > m.clientWidth + 1, scrollWidth: m.scrollWidth, findings: m.findings.filter((f) => ['offscreen', 'truncated', 'overlap'].includes(f.kind)) };
    await page.context().close();
    writeFileSync(`${AUDIT_OUT}/motion-zoom/zoom-${s.id}.json`, JSON.stringify(res, null, 2));
    for (const [k, v] of Object.entries(res)) expect.soft((v as { overflow: boolean }).overflow, `débordement ${k}`).toBe(false);
  });
}
