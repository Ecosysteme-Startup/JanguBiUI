import { expect, test } from '@playwright/test';

/**
 * Profile page — rewritten in French to match the actual UI.
 *
 * Auth state is provided via storageState (configured in playwright.config.ts).
 * Each test navigates to /app/profil independently so tests are isolated.
 */

test.describe('Page de profil', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the profile update API so no real backend mutation occurs.
    await page.route('**/v1/me/', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'ok' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/app/profil');
  });

  // ── Page structure ──────────────────────────────────────────────────────────

  test('page loads and shows "Informations personnelles" section', async ({
    page,
  }) => {
    await expect(
      page.getByText('Informations personnelles'),
    ).toBeVisible();
  });

  test('page shows "Changer le mot de passe" section', async ({ page }) => {
    await expect(page.getByText('Changer le mot de passe')).toBeVisible();
  });

  test('page shows "Session" section with logout button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /se déconnecter/i }),
    ).toBeVisible();
  });

  test('page shows "Zone de danger" with delete account button', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /supprimer mon compte/i }),
    ).toBeVisible();
  });

  // ── Profile info form ───────────────────────────────────────────────────────

  test('profile form contains Prénom, Nom and Téléphone fields', async ({
    page,
  }) => {
    await expect(page.getByLabel(/^prénom$/i)).toBeVisible();
    await expect(page.getByLabel(/^nom$/i)).toBeVisible();
    await expect(page.getByLabel(/téléphone/i)).toBeVisible();
  });

  test('submitting profile update shows "Profil mis à jour" notification', async ({
    page,
  }) => {
    // Mock the profile endpoint to return success before navigating.
    await page.route('**/v1/users/profile/', async (route) => {
      if (['PATCH', 'PUT'].includes(route.request().method())) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'ok' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByLabel(/^prénom$/i).clear();
    await page.getByLabel(/^prénom$/i).fill('Nouveau');

    await page.getByRole('button', { name: /enregistrer/i }).click();

    // The ProfilContent component fires addNotification({ message: 'Profil mis à jour' })
    await expect(page.getByText(/profil mis à jour/i)).toBeVisible({
      timeout: 8_000,
    });
  });

  // ── Connexion et sécurité (Keycloak) ────────────────────────────────────────

  test('mot de passe et double authentification : lien vers le compte Keycloak', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: /gérer ma connexion/i }),
    ).toHaveAttribute('href', /\/realms\/jangubi\/account\//);
  });

  // ── Logout ──────────────────────────────────────────────────────────────────

  test('« Se déconnecter » termine la session Keycloak', async ({ page }) => {
    const fin = page.waitForRequest((r) =>
      r.url().includes('/protocol/openid-connect/logout'),
    );
    await page.route('**/protocol/openid-connect/logout**', (route) =>
      route.fulfill({ status: 302, headers: { location: '/' } }),
    );

    await page.getByRole('button', { name: /se déconnecter/i }).click();

    const url = new URL((await fin).url());
    expect(url.searchParams.get('client_id')).toBe('jangubi-web');
  });

  // ── Danger zone ─────────────────────────────────────────────────────────────

  test('clicking "Supprimer mon compte" shows a confirmation step', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: /supprimer mon compte/i })
      .click();

    // The UI renders a confirmation message and two buttons: Annuler / Confirmer
    await expect(
      page.getByRole('button', { name: /annuler/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /confirmer/i }),
    ).toBeVisible();
  });

  test('clicking "Annuler" hides the delete confirmation', async ({ page }) => {
    await page
      .getByRole('button', { name: /supprimer mon compte/i })
      .click();
    await page.getByRole('button', { name: /annuler/i }).click();

    // The original "Supprimer mon compte" button should reappear
    await expect(
      page.getByRole('button', { name: /supprimer mon compte/i }),
    ).toBeVisible();
  });
});
