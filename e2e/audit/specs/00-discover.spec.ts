import { writeFileSync } from 'node:fs';
import { test, type Page } from '@playwright/test';
import { AUDIT_OUT } from '../playwright.audit.config';
import { statePath } from '../helpers/screens';
import { clientNav, warmSession } from '../helpers/nav';

/** Découverte des identifiants réels (nœuds, annonces, demandes…) pour construire la liste d'écrans. */
async function links(page: Page, path: string) {
  await clientNav(page, path);
  return { url: page.url(), links: [...new Set(await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? '')))].filter((h) => h.startsWith('/')) };
}

test('découverte', async ({ browser }) => {
  test.setTimeout(300_000);
  const out: Record<string, unknown> = {};
  const plan: Record<string, string[]> = {
    fidele: ['/app/paroisse', '/app/demandes', '/app/pretres', '/app/notifications'],
    mineur: ['/app/pretres'],
    cure: ['/espace'],
    chancelier: ['/espace'],
    plateforme: ['/plateforme'],
  };
  for (const [p, paths] of Object.entries(plan)) {
    const ctx = await browser.newContext({ storageState: statePath(p) });
    const page = await ctx.newPage();
    await warmSession(page);
    for (const path of paths) out[`${p} ${path}`] = await links(page, path);
    if (p === 'cure' || p === 'chancelier') {
      const base = new URL(page.url()).pathname;
      out[`${p} base`] = base;
      for (const sub of ['/demandes', '/annonces', '/agenda', '/messagerie', '/structure', '/equipe']) out[`${p} ${base}${sub}`] = await links(page, base + sub);
    }
    await ctx.close();
  }
  writeFileSync(`${AUDIT_OUT}/discover.json`, JSON.stringify(out, null, 2));
});
