import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { AUDIT_OUT } from '../playwright.audit.config';
import { clientNav, settle, warmSession } from '../helpers/nav';
import { measureLayout, runAxe, WIDTHS, type AxeFinding, type LayoutFinding } from '../helpers/measure';
import { SCREENS, statePath, type Screen } from '../helpers/screens';

/**
 * Recette 03 — pour chaque écran : axe (clair/sombre × 375/1440), mesures de mise en page aux
 * 6 largeurs, captures pleine page à 375 et 1440 (clair). Les constats sont écrits en JSON dans
 * AUDIT_OUT/results et agrégés dans le rapport ; les assertions sont « soft » pour tout collecter.
 */
const CAPTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../docs/v1/recette/captures/03');
mkdirSync(CAPTURES, { recursive: true });
mkdirSync(`${AUDIT_OUT}/results`, { recursive: true });

async function open(page: Page, s: Screen) {
  if (s.persona === 'anonyme') {
    await page.goto(s.path);
    if (s.id.startsWith('kc-')) await page.waitForURL(/\/realms\/jangubi\//);
    await settle(page);
  } else {
    await warmSession(page);
    await clientNav(page, s.path);
  }
}

async function setScheme(page: Page, scheme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: scheme });
  await page.waitForTimeout(350);
}

test.describe.configure({ mode: 'parallel' });

for (const s of SCREENS) {
  test(`${s.id} — ${s.label}`, async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: s.persona === 'anonyme' ? undefined : statePath(s.persona),
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
      locale: 'fr-FR',
      timezoneId: 'Africa/Dakar',
    });
    const page = await ctx.newPage();
    const apiErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes(':8001/api/') && r.status() >= 400) apiErrors.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`);
    });
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
    });

    await open(page, s);
    const finalUrl = page.url();
    const h1 = await page.locator('h1').first().textContent().catch(() => null);

    const axe: Record<string, AxeFinding[]> = {};
    for (const w of [1440, 375]) {
      await page.setViewportSize({ width: w, height: w < 768 ? 812 : 900 });
      for (const scheme of ['light', 'dark'] as const) {
        await setScheme(page, scheme);
        axe[`${scheme}@${w}`] = await runAxe(page);
      }
    }
    await setScheme(page, 'light');

    const layout: Record<string, { overflow: boolean; scrollWidth: number; findings: LayoutFinding[] }> = {};
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: w < 768 ? 812 : 900 });
      await page.waitForTimeout(500);
      const m = await measureLayout(page);
      layout[w] = { overflow: m.scrollWidth > m.clientWidth + 1, scrollWidth: m.scrollWidth, findings: m.findings };
      if (w === 375 || w === 1440) {
        await page.screenshot({ path: `${CAPTURES}/${s.id}-${w}.jpg`, fullPage: true, type: 'jpeg', quality: 60 });
      }
    }

    writeFileSync(
      `${AUDIT_OUT}/results/${s.id}.json`,
      JSON.stringify({ screen: s, finalUrl, h1, apiErrors: [...new Set(apiErrors)], consoleErrors: [...new Set(consoleErrors)].slice(0, 10), axe, layout }, null, 2),
    );
    await ctx.close();

    const axeIds = [...new Set(Object.values(axe).flat().map((v) => v.id))];
    expect.soft(axeIds, 'violations axe').toEqual([]);
    expect.soft(WIDTHS.filter((w) => layout[w].overflow), 'débordement horizontal').toEqual([]);
  });
}
