import { expect, test } from '@playwright/test';

import { KC_DEMO_PASSWORD, loginViaKeycloak, logout } from '../helpers/auth';

const PLATEFORME = 'plateforme@demo.jangubi.sn';
/** Domaine réservé aux comptes créés par les agents de recette : jamais un compte de démo. */
const DOMAINE_TEST = 'test.jangubi.sn';

test.describe('Plateforme (plateforme@) en profondeur', () => {
  test('référentiels', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, PLATEFORME, KC_DEMO_PASSWORD, { entryPath: '/plateforme/referentiels' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/plateforme\/referentiels/);
    await expect(page.getByText(/erreur 500|un incident nous empêche/i)).toHaveCount(0);
    await expect(page.getByText('Le référentiel n’a pas pu être chargé')).toHaveCount(0);
    await page.screenshot({ path: `docs/v1/recette/captures/01/plateforme-referentiels-${testInfo.project.name}.png`, fullPage: true });
    await page.goto('/app');
    await logout(page);
  });

  test('comptes (synchronisés avec Keycloak) : recherche, puis désactive et réactive un compte de TEST', async ({
    page,
  }, testInfo) => {
    await loginViaKeycloak(page, PLATEFORME, KC_DEMO_PASSWORD, { entryPath: '/plateforme/comptes' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/plateforme\/comptes$/);
    await expect(page.getByRole('heading', { name: 'Administration des comptes' })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `docs/v1/recette/captures/01/plateforme-comptes-${testInfo.project.name}.png`, fullPage: true });

    // Onglets de la section : l'administrateur plateforme voit aussi « Synchronisation ».
    const onglets = page.getByRole('navigation', { name: 'Administration des comptes' });
    await expect(onglets.getByRole('link', { name: 'Synchronisation' })).toBeVisible();
    await onglets.getByRole('link', { name: 'Comptes', exact: true }).click();
    await expect(page).toHaveURL(/\/plateforme\/comptes\/utilisateurs/);
    await expect(page.getByRole('heading', { name: 'Comptes', exact: true })).toBeVisible();

    const recherche = page.getByRole('searchbox', { name: 'Rechercher' });
    await expect(recherche).toBeVisible({ timeout: 10_000 });
    await recherche.fill(DOMAINE_TEST);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.screenshot({ path: `docs/v1/recette/captures/01/plateforme-comptes-recherche-${testInfo.project.name}.png`, fullPage: true });

    const table = page.getByRole('table', { name: 'Comptes de votre périmètre' });
    const premier = table.getByRole('row').filter({ hasText: DOMAINE_TEST }).first();
    if (!(await premier.isVisible({ timeout: 5_000 }).catch(() => false))) {
      testInfo.annotations.push({
        type: 'observation',
        description: `Aucun compte de test (@${DOMAINE_TEST}) dans la recherche : parcours 02 (inscription) non joué ou compte supprimé.`,
      });
      await logout(page);
      return;
    }

    // Fiche du compte : nom en titre, zone sensible à droite.
    await premier.getByRole('link').first().click();
    await expect(page).toHaveURL(/\/plateforme\/comptes\/utilisateurs\/[^/]+$/);
    const sensible = page.getByRole('region', { name: 'Zone sensible' });
    await expect(sensible).toBeVisible({ timeout: 10_000 });

    // Un compte laissé désactivé par un passage précédent est d'abord réactivé.
    const reactiver = sensible.getByRole('button', { name: 'Réactiver le compte' });
    if (await reactiver.isVisible().catch(() => false)) {
      await reactiver.click();
      await expect(sensible.getByRole('button', { name: 'Désactiver le compte' })).toBeVisible({ timeout: 10_000 });
    }

    await sensible.getByRole('button', { name: 'Désactiver le compte' }).click();
    const dialogue = page.getByRole('dialog', { name: /^Désactiver le compte de / });
    await expect(dialogue).toBeVisible({ timeout: 10_000 });
    await dialogue.getByLabel(/^Motif/).fill('Recette automatisée : vérification de la désactivation.');
    await dialogue.getByRole('button', { name: 'Désactiver', exact: true }).click();
    await expect(dialogue).toBeHidden({ timeout: 10_000 });
    await expect(sensible.getByRole('button', { name: 'Réactiver le compte' })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `docs/v1/recette/captures/01/plateforme-compte-desactive-${testInfo.project.name}.png`, fullPage: true });

    // Réactive immédiatement : le compte de test ne reste jamais bloqué.
    await sensible.getByRole('button', { name: 'Réactiver le compte' }).click();
    await expect(sensible.getByRole('button', { name: 'Désactiver le compte' })).toBeVisible({ timeout: 10_000 });

    await page.goto('/app');
    await logout(page);
  });

  test('comptes : journal d’audit de la section', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, PLATEFORME, KC_DEMO_PASSWORD, { entryPath: '/plateforme/comptes/journal' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/plateforme\/comptes\/journal/);
    await expect(
      page.getByRole('navigation', { name: 'Administration des comptes' }).getByRole('link', { name: 'Journal d’audit' }),
    ).toHaveAttribute('aria-current', 'page');
    await page.screenshot({ path: `docs/v1/recette/captures/01/plateforme-comptes-journal-${testInfo.project.name}.png`, fullPage: true });
    await page.goto('/app');
    await logout(page);
  });

  test('audit', async ({ page }, testInfo) => {
    await loginViaKeycloak(page, PLATEFORME, KC_DEMO_PASSWORD, { entryPath: '/plateforme/audit' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/audit/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/plateforme-audit-${testInfo.project.name}.png`, fullPage: true });
    await page.goto('/app');
    await logout(page);
  });
});
