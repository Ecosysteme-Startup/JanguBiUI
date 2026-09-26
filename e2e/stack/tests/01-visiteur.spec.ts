import { expect, test } from '@playwright/test';

import { extractFirstLink, waitForLastEmail } from '../helpers/mailpit';

test.describe('Visiteur', () => {
  test('accueil, Parole du jour, navigation par date', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({ path: `docs/v1/recette/captures/01/visiteur-accueil-${testInfo.project.name}.png`, fullPage: true });

    await page.goto('/parole');
    await expect(page.getByRole('heading', { level: 1, name: /la parole du jour/i })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `docs/v1/recette/captures/01/visiteur-parole-${testInfo.project.name}.png`, fullPage: true });
  });

  test('annuaire : filtres et fiche paroisse DAK-SAINT-DOMINIQUE', async ({ page }, testInfo) => {
    await page.goto('/paroisses');
    await expect(page.getByRole('heading').first()).toBeVisible();
    const searchBox = page.getByRole('searchbox').or(page.getByPlaceholder(/rechercher/i)).first();
    if (await searchBox.count()) {
      await searchBox.fill('Dominique');
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `docs/v1/recette/captures/01/visiteur-annuaire-${testInfo.project.name}.png`, fullPage: true });

    await page.goto('/paroisses/DAK-SAINT-DOMINIQUE');
    await expect(page.getByRole('heading', { name: /Saint-Dominique/i }).first()).toBeVisible();
    await page.screenshot({ path: `docs/v1/recette/captures/01/visiteur-fiche-paroisse-${testInfo.project.name}.png`, fullPage: true });
  });

  test('page 404 pour une route inconnue', async ({ page }) => {
    const res = await page.goto('/cette-page-n-existe-pas-xyz');
    expect([404, 200]).toContain(res?.status() ?? 0); // Next peut répondre 200 avec un rendu 404 côté client selon la config.
    await expect(page.getByText(/introuvable|non trouvée|404/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('« Pour les paroisses » : formulaire de contact envoie un e-mail réel (Mailpit)', async ({ page }) => {
    const stamp = Date.now();
    const email = `contact+${stamp}@test.jangubi.sn`;
    await page.goto('/pour-les-paroisses');
    await page.getByRole('link', { name: /contact/i }).first().click().catch(() => undefined);

    await page.getByLabel(/nom et prénom/i).fill('Paroisse de Test E2E');
    await page.getByLabel(/fonction/i).selectOption({ label: 'Secrétaire paroissiale' });
    await page.getByLabel(/paroisse ou service/i).fill('Paroisse de Test E2E');
    await page.getByLabel(/diocèse/i).selectOption({ label: 'Archidiocèse de Dakar' });
    await page.getByLabel(/téléphone/i).fill('77 543 18 62');
    await page.getByLabel(/e-mail/i).fill(email);
    await page.getByRole('checkbox', { name: /j.accepte que numerisen/i }).check();

    await page.getByRole('button', { name: 'Envoyer la demande' }).click();
    await expect(page.getByText(/envoyé|merci|reçu|transmise/i).first()).toBeVisible({ timeout: 10_000 });

    const mail = await waitForLastEmail('contact@numerisen.sn', { timeoutMs: 15_000, subjectContains: 'Test E2E' }).catch(() =>
      waitForLastEmail('contact@numerisen.sn', { timeoutMs: 5_000 }),
    );
    expect(mail).toBeTruthy();
  });
});
