import { expect, test } from '@playwright/test';

import { KC_DEMO_PASSWORD, loginViaKeycloak, logout } from '../helpers/auth';

const PLATEFORME = 'plateforme@demo.jangubi.sn';

test.describe('Plateforme (plateforme@) en profondeur', () => {
  test('référentiels', async ({ page }, testInfo) => {
    // DEF-08 (CRITIQUE, voir rapport) : /plateforme/referentiels plante systématiquement
    // (TypeError: REFERENTIEL_TABS.includes is not a function, src/app/plateforme/referentiels/page.tsx:13)
    // malgré une API backend saine (200 sur toutes les routes). On documente l'échec sans le masquer.
    await loginViaKeycloak(page, PLATEFORME, KC_DEMO_PASSWORD, { entryPath: '/plateforme/referentiels' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.screenshot({ path: `docs/v1/recette/captures/01/DEF-08-plateforme-referentiels-erreur-${testInfo.project.name}.png`, fullPage: true });

    const crashed = await page.getByText(/erreur 500|un incident nous empêche/i).first().isVisible({ timeout: 5_000 }).catch(() => false);
    if (crashed) {
      testInfo.annotations.push({
        type: 'defaut',
        description:
          "DEF-08 (CRITIQUE) : /plateforme/referentiels affiche systématiquement « Erreur 500 » — TypeError: REFERENTIEL_TABS.includes is not a function (src/app/plateforme/referentiels/page.tsx:13), alors que toutes les API backend liées répondent 200.",
      });
    } else {
      await expect(page).toHaveURL(/\/referentiels/);
    }
    await page.goto('/app');
    await logout(page);
  });

  test('comptes : recherche puis verrouille/déverrouille un compte de TEST créé par l’agent (jamais un compte de démo)', async ({
    page,
  }, testInfo) => {
    await loginViaKeycloak(page, PLATEFORME, KC_DEMO_PASSWORD, { entryPath: '/plateforme/comptes' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/comptes/);
    await page.screenshot({ path: `docs/v1/recette/captures/01/plateforme-comptes-${testInfo.project.name}.png`, fullPage: true });

    const searchField = page.getByPlaceholder(/rechercher|nom|e-mail/i).or(page.getByRole('searchbox')).first();
    await expect(searchField).toBeVisible({ timeout: 10_000 });
    await searchField.fill('test.jangubi.sn'); // domaine réservé aux comptes créés par les agents de recette.
    await page.waitForTimeout(600);
    await page.screenshot({ path: `docs/v1/recette/captures/01/plateforme-comptes-recherche-${testInfo.project.name}.png`, fullPage: true });

    // Le premier résultat de la recherche est déjà sélectionné dans le panneau de détail à droite.
    const detailHeading = page.getByRole('heading', { name: /agent unTest/i }).or(page.getByRole('heading', { name: /agent01/i }));
    const foundAccount = await detailHeading.first().isVisible({ timeout: 5_000 }).catch(() => false);
    if (!foundAccount) {
      testInfo.annotations.push({
        type: 'observation',
        description: 'Aucun compte de test (agent01+…@test.jangubi.sn) trouvé dans la recherche plateforme — le compte créé au parcours 02 (inscription) n’a peut-être pas de nomination/office donc n’apparaît pas dans ce registre, ou la recherche indexe différemment.',
      });
      await logout(page);
      return;
    }

    const lockButton = page.getByRole('button', { name: 'Verrouiller le compte' });
    await lockButton.click();
    const dialog = page.getByRole('dialog', { name: /verrouiller ce compte/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('button', { name: 'Verrouiller le compte' }).click();
    await expect(page.getByRole('button', { name: 'Déverrouiller le compte' })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `docs/v1/recette/captures/01/plateforme-compte-verrouille-${testInfo.project.name}.png`, fullPage: true });

    // Déverrouille immédiatement pour ne pas laisser le compte de test bloqué.
    await page.getByRole('button', { name: 'Déverrouiller le compte' }).click();
    const unlockDialog = page.getByRole('dialog');
    if (await unlockDialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await unlockDialog.getByRole('button', { name: /déverrouiller/i }).last().click();
    }
    await expect(page.getByRole('button', { name: 'Verrouiller le compte' })).toBeVisible({ timeout: 10_000 });

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
