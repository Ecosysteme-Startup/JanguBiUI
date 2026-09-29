import { expect, test } from '@playwright/test';

/**
 * Connexion Keycloak (Authorization Code + PKCE), sans Keycloak : la page
 * d'autorisation et le point de jeton du realm sont interceptés.
 */

const KEYCLOAK = process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8180';
const OIDC = `${KEYCLOAK}/realms/jangubi/protocol/openid-connect`;

test.use({ storageState: { cookies: [], origins: [] } });

test.skip(
  process.env.NEXT_PUBLIC_API_MOCKING === 'true',
  'Mode mocks : la page de connexion propose des comptes de démonstration.',
);

test('connexion : PKCE vers Keycloak, rappel, retour à la page demandée', async ({
  page,
}) => {
  let verifier: string | null = null;
  await page.route(`${OIDC}/auth?**`, async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('client_id')).toBe('jangubi-web');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    const retour = new URL(url.searchParams.get('redirect_uri')!);
    retour.searchParams.set('code', 'code-e2e');
    retour.searchParams.set('state', url.searchParams.get('state')!);
    await route.fulfill({ status: 302, headers: { location: retour.toString() } });
  });
  await page.route(`${OIDC}/token`, async (route) => {
    const form = new URLSearchParams(route.request().postData() ?? '');
    verifier = form.get('code_verifier');
    await route.fulfill({
      json: { access_token: 'acces-e2e', expires_in: 600, refresh_token: 'r' },
    });
  });
  await page.route('**/v1/me/', (route) =>
    route.fulfill({
      json: {
        id: '0c7b0000-0000-4000-8000-000000000001',
        email: 'marie-therese.diouf@example.sn',
        profile: { first_name: 'Marie-Thérèse', last_name: 'Diouf' },
        etat_de_vie: 'laic',
        degre_ordre: 'aucun',
        statut_verification: 'declare',
        paroisse_suivie: null,
      },
    }),
  );
  await page.route('**/v1/me/capacites/', (route) => route.fulfill({ json: [] }));

  await page.goto('/auth/login?redirectTo=%2Fapp%2Fprofil');
  await page.waitForURL('**/app/profil', { timeout: 15_000 });
  expect(verifier).toMatch(/^[\w-]{64}$/);
});

test('inscription : page Keycloak avec prompt=create', async ({ page }) => {
  const demande = page.waitForRequest((r) => r.url().startsWith(`${OIDC}/auth`));
  await page.route(`${OIDC}/auth?**`, (route) =>
    route.fulfill({ body: 'Keycloak' }),
  );
  await page.goto('/auth/register');
  const url = new URL((await demande).url());
  expect(url.searchParams.get('prompt')).toBe('create');
});
