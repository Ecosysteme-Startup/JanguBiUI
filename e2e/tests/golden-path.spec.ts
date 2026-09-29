import { expect, test } from '@playwright/test';

/**
 * RECETTE GOLDEN-PATH (front) — segment DON du parcours multi-appartenance.
 *
 * Le fidèle membre de l'église A (principale) et de l'église B fait un don à
 * l'église B en espèces. Le paiement en ligne est présenté « bientôt disponible »
 * (désactivé) — conforme à la garde 5a / au comportement 7c.
 *
 * Le segment DOCUMENT (picker paroisse) est couvert par documents.spec.ts ; les
 * segments ONBOARDING (cascade multi-église) et FIL AGRÉGÉ sont couverts par les
 * tests composants vitest (onboarding-page, church-cascade-selector) et par le
 * test d'intégration back (golden-path, étapes 1-3) qui fait autorité.
 *
 * API mockée via page.route → la suite tourne sans backend réel.
 */

const ME_WITH_TWO_CHURCHES = {
  id: 'user-1',
  email: 'fidele@example.com',
  role: 'fidele',
  pastoral_role: 'fidele',
  onboarding_state: 'completed',
  is_active: true,
  is_verified: true,
  is_admin: false,
  is_staff: false,
  profile: { first_name: 'Aminata', last_name: 'Diallo' },
  memberships: [
    {
      id: 1,
      church: { id: 111, name: 'Église A' },
      parish: { id: 11, name: 'Paroisse A' },
      diocese: { id: 1, name: 'Diocèse de Dakar' },
      is_primary: true,
    },
    {
      id: 2,
      church: { id: 211, name: 'Église B' },
      parish: { id: 21, name: 'Paroisse B' },
      diocese: { id: 2, name: 'Diocèse de Thiès' },
      is_primary: false,
    },
  ],
  church_ids: [111, 211],
  parish_ids: [11, 21],
  diocese_ids: [1, 2],
};

test.describe('Golden path — don (bénéficiaire église B, espèces, online désactivé)', () => {
  let donateBody: Record<string, unknown> | null = null;

  test.beforeEach(async ({ page }) => {
    donateBody = null;

    await page.route('**/v1/me/', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ME_WITH_TWO_CHURCHES),
      }),
    );
    await page.route('**/v1/donations/campaigns/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, results: [] }),
      }),
    );
    await page.route('**/v1/donations/donate/**', async (route) => {
      donateBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, status: 'pending', amount: '5000' }),
      });
    });

    await page.goto('/app/dons');
  });

  test('le bénéficiaire par défaut est l’église principale (A)', async ({
    page,
  }) => {
    const beneficiary = page.locator('#beneficiary-select');
    await expect(beneficiary).toBeVisible();
    // L'option sélectionnée par défaut porte « (principale) ».
    await expect(
      beneficiary.locator('option:checked'),
    ).toContainText(/principale/i);
  });

  test('le paiement en ligne est désactivé, espèces actif', async ({ page }) => {
    const provider = page.locator('#provider-select');
    await expect(provider.locator('option', { hasText: /wave/i })).toBeDisabled();
    await expect(
      provider.locator('option', { hasText: /espèces/i }),
    ).toBeEnabled();
  });

  test('don à l’église B en espèces → payload church_id=211, provider=cash', async ({
    page,
  }) => {
    await page.locator('#beneficiary-select').selectOption('211');
    await page.locator('#amount-input').fill('5000');
    await page.getByRole('button', { name: /confirmer le don/i }).click();

    await expect.poll(() => donateBody).not.toBeNull();
    expect(donateBody).toMatchObject({
      church_id: 211,
      parish_id: 21,
      payment_provider: 'cash',
      amount: 5000,
    });
  });
});
