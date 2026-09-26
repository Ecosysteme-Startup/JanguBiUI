import type { Page } from '@playwright/test';

/**
 * Les pages connectées chargées « à froid » (goto/rechargement) lancent leurs requêtes avant que la
 * session Auth.js ne soit résolue : 401 sans nouvel essai (défaut A11Y-00 du rapport 03).
 * Pour auditer les VRAIES données, on charge d'abord une page publique, on attend la session, puis
 * on navigue côté client (routeur Next), comme le ferait un utilisateur qui clique un lien.
 */
export async function warmSession(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(
    () => fetch('/api/auth/session').then((r) => r.json()).then((s) => Boolean(s?.accessToken)),
    undefined,
    { timeout: 20_000 },
  );
  // Laisse le SessionProvider hydrater le jeton dans le pont API.
  await page.waitForTimeout(800);
}

export async function clientNav(page: Page, path: string): Promise<void> {
  const target = new URL(path, 'http://localhost:3000');
  await page.evaluate((p) => (window as unknown as { next: { router: { push: (u: string) => void } } }).next.router.push(p), path);
  await page
    .waitForURL((u) => u.pathname === target.pathname || u.pathname.startsWith(target.pathname), { timeout: 20_000 })
    .catch(() => undefined);
  await settle(page);
}

/** Attend la fin des requêtes et des squelettes de chargement. */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  await page
    .waitForFunction(() => !document.querySelector('[aria-busy="true"], .animate-pulse'), undefined, { timeout: 8_000 })
    .catch(() => undefined);
  await page.waitForTimeout(400);
}
