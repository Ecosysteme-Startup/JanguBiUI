import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

// Connexion par Keycloak (page de connexion du realm) ; en mode mocks
// (NEXT_PUBLIC_API_MOCKING=true), choix d'un compte de démonstration.
// Le jeton de rafraîchissement vit dans le sessionStorage (non sauvegardé par
// storageState) : les specs retrouvent la session par le cookie SSO Keycloak.
const EMAIL = process.env.E2E_USER_EMAIL ?? 'fidele@demo.jangubi.sn';
const PASSWORD = process.env.E2E_USER_PASSWORD ?? '';

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login');

  const demo = page.getByRole('button', { name: /Marie-Thérèse Diouf/ });
  const keycloak = page.locator('#username');
  await demo.or(keycloak).first().waitFor({ timeout: 15_000 });

  if (await demo.isVisible()) {
    await demo.click();
  } else {
    await keycloak.fill(EMAIL);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#kc-login').click();
  }

  await page.waitForURL((url) => url.pathname.startsWith('/app'), {
    timeout: 15_000,
  });

  await page.context().storageState({ path: authFile });
});
