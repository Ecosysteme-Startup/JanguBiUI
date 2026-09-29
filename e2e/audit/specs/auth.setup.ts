import { existsSync, mkdirSync, statSync } from 'node:fs';
import { test as setup } from '@playwright/test';
import { AUDIT_OUT } from '../playwright.audit.config';
import { ensureStaffMfa, login } from '../helpers/login';
import { PERSONAS, statePath } from '../helpers/screens';

/** Une session par persona, réutilisée par tous les tests (évite N connexions / OTP). */
mkdirSync(AUDIT_OUT, { recursive: true });
for (const [persona, { email, entry }] of Object.entries(PERSONAS)) {
  setup(`session ${persona}`, async ({ page }) => {
    const file = statePath(persona);
    // Session fraîche (< 20 min) : on la garde.
    if (existsSync(file) && Date.now() - statSync(file).mtimeMs < 20 * 60_000) return;
    await login(page, email, entry);
    await page.waitForURL((u) => u.origin === 'http://localhost:3000', { timeout: 30_000 });
    if (!['fidele', 'mineur'].includes(persona)) {
      await ensureStaffMfa(page, email, entry);
      await page.waitForURL((u) => u.origin === 'http://localhost:3000', { timeout: 30_000 });
    }
    await page.context().storageState({ path: file });
  });
}
