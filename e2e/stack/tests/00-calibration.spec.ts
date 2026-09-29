import { test } from '@playwright/test';

import { KC_DEMO_PASSWORD, loginViaKeycloak } from '../helpers/auth';

test('@calibration referentiels console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}\n${err.stack}`));

  await loginViaKeycloak(page, 'plateforme@demo.jangubi.sn', KC_DEMO_PASSWORD, { entryPath: '/plateforme/referentiels' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  console.log('=== CONSOLE ERRORS ===');
  for (const e of errors) console.log(e);
  console.log('=== END ===');
});
