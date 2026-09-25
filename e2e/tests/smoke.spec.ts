import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('fumée des shells', () => {
  test('l’accueil public se charge avec sa navigation et son pied de page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toContainText('Jàmm ak jàmm');
  });

  test('l’accueil public ne présente aucune violation axe', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('une adresse inconnue affiche la page 404 de la charte', async ({ page }) => {
    const response = await page.goto('/cette-page-n-existe-pas');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /cette page n.existe pas/i })).toBeVisible();
  });

  test('la bascule sombre applique le thème', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Affichage sombre' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
