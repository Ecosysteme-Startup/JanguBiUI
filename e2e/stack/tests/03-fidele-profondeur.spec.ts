import { expect, test } from '@playwright/test';
import { KC_DEMO_PASSWORD, loginViaKeycloak, logout } from '../helpers/auth';

const FIDELE = 'fidele@demo.jangubi.sn';

test.describe('Fidèle en profondeur (fidele@)', () => {
  test('accueil, Parole, Bible (chapitre → verset)', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, FIDELE, KC_DEMO_PASSWORD, { entryPath: '/app' });
    await expect(page).toHaveURL(/\/app/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-accueil-${testInfo.project.name}.png`, fullPage: true });

    await page.goto('/app/bible');
    await expect(page).toHaveURL(/\/app\/bible/);
    // Ouvre un livre puis un chapitre (navigation utilisateur réelle, sans deviner l'URL).
    const firstBook = page.getByRole('link').filter({ hasText: /genèse|matthieu|psaume/i }).first();
    if (await firstBook.count()) {
      await firstBook.click();
      const firstChapter = page.getByRole('link', { name: /^1$|chapitre 1/i }).first();
      if (await firstChapter.count()) await firstChapter.click();
    }
    await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-bible-chapitre-${testInfo.project.name}.png`, fullPage: true });
    // Un verset doit être identifiable/cliquable (ancre ou surlignage) — capture pour revue visuelle.

    await logout(page);
  });

  test('chapelet guidé', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, FIDELE, KC_DEMO_PASSWORD, { entryPath: '/app/chapelet' });
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 });
    const startButton = page.getByRole('button', { name: /commencer/i }).or(page.getByRole('link', { name: /commencer/i }));
    if (await startButton.count()) await startButton.first().click();
    await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-chapelet-${testInfo.project.name}.png`, fullPage: true });
    await logout(page);
  });

  test('Ma paroisse : annonce et événement (avec inscription)', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, FIDELE, KC_DEMO_PASSWORD, { entryPath: '/app/paroisse' });
    await expect(page).toHaveURL(/\/app\/paroisse/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-ma-paroisse-${testInfo.project.name}.png`, fullPage: true });

    // Annonces : ouvre la première annonce listée si présente (nouvelle navigation, jamais goBack
    // après une redirection OAuth, qui peut réafficher une page Keycloak périmée).
    const annonceLink = page.locator('a[href*="/app/paroisse/annonces/"]').first();
    if (await annonceLink.count()) {
      await annonceLink.click();
      await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-annonce-${testInfo.project.name}.png`, fullPage: true });
      await page.goto('/app/paroisse');
    }

    const evenementLink = page.locator('a[href*="/app/paroisse/evenements/"]').first();
    if (await evenementLink.count()) {
      await evenementLink.click();
      await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-evenement-${testInfo.project.name}.png`, fullPage: true });
      const registerButton = page.getByRole('button', { name: /m.inscrire|je participe|s.inscrire/i });
      if (await registerButton.count()) {
        await registerButton.first().click();
        await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-evenement-inscrit-${testInfo.project.name}.png`, fullPage: true });
      }
    }
    await logout(page);
  });

  test('notifications', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, FIDELE, KC_DEMO_PASSWORD, { entryPath: '/app/notifications' });
    await expect(page).toHaveURL(/\/app\/notifications/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-notifications-${testInfo.project.name}.png`, fullPage: true });
    await logout(page);
  });

  test('profil : préférences, export, « Mon état de vie »', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, FIDELE, KC_DEMO_PASSWORD, { entryPath: '/app/profil' });
    await expect(page).toHaveURL(/\/app\/profil/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-profil-${testInfo.project.name}.png`, fullPage: true });

    const etatDeVie = page.getByRole('heading', { name: /état de vie/i }).or(page.getByText(/état de vie/i)).first();
    if (await etatDeVie.count()) await etatDeVie.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-profil-etat-de-vie-${testInfo.project.name}.png`, fullPage: true });

    const exportButton = page.getByRole('button', { name: /exporter mes données|export/i });
    if (await exportButton.count()) {
      await exportButton.first().click();
      await page.screenshot({ path: `docs/v1/recette/captures/01/fidele-profil-export-${testInfo.project.name}.png`, fullPage: true });
    }
    await logout(page);
  });
});
