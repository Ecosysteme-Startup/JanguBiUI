import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibilité réelle (contraste compris) des pages publiques, rendues par Next.
 * Sans backend, les pages affichent leurs états d'erreur : ils doivent être accessibles aussi.
 * Les espaces connectés sont couverts par l'audit axe de chaque test d'intégration (Vitest).
 */
const ROUTES = ['/', '/paroisses', '/parole', '/pour-les-paroisses', '/confidentialite', '/conditions', '/page-inconnue'];

for (const route of ROUTES) {
  test(`axe : ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}
