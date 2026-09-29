import { expect, test } from '@playwright/test';

/**
 * Fumée du site public (F4). Sans backend : on ne vérifie que ce qui s'affiche toujours
 * (titres, formulaires, états d'erreur explicites) ; avec backend, les mêmes assertions tiennent.
 */
test.describe('site public', () => {
  test('l’annuaire des paroisses affiche sa recherche et un état lisible', async ({ page }) => {
    await page.goto('/paroisses?q=dakar');
    await expect(page.getByRole('heading', { level: 1, name: /trouver une paroisse/i })).toBeVisible();
    await expect(page.getByRole('search', { name: 'Rechercher une paroisse' })).toBeVisible();
    await expect(page.getByLabel('Paroisse, quartier ou ville')).toHaveValue('dakar');
    await expect(
      page
        .getByRole('region', { name: 'Liste des paroisses' })
        .getByText(/paroisse|l’annuaire n’a pas pu être chargé|aucune paroisse/i)
        .first(),
    ).toBeVisible();
  });

  test('la Parole du jour affiche le jour liturgique ou une erreur explicite', async ({ page }) => {
    await page.goto('/parole?date=2026-09-24');
    const loaded = page.getByRole('navigation', { name: 'Changer de jour' });
    const failed = page.getByText(/les lectures n’ont pas pu être chargées|aucune liturgie pour cette date/i);
    await expect(loaded.or(failed)).toBeVisible();
    if (await loaded.isVisible()) {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(loaded.getByRole('link', { name: /mercredi 23 septembre/i })).toHaveAttribute('href', '/parole?date=2026-09-23');
    } else {
      await expect(page.getByRole('link', { name: /revenir à aujourd.hui/i })).toHaveAttribute('href', '/parole');
    }
  });

  test('le formulaire de contact des paroisses est joignable par son ancre', async ({ page }) => {
    await page.goto('/pour-les-paroisses#contact');
    await expect(page.getByRole('heading', { name: 'Demander une présentation' })).toBeVisible();
    // Un clic avant l'hydratation ne déclenche pas la validation : on réessaie jusqu'à ce que
    // le formulaire (îlot client) réponde.
    await expect(async () => {
      await page.getByRole('button', { name: 'Envoyer la demande' }).click();
      await expect(page.getByText('Indiquez votre prénom et votre nom.')).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
  });
});
