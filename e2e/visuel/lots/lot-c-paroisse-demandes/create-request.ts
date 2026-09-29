/**
 * Crée UNE demande d'acte de test pour fidele2@demo.jangubi.sn (captures du suivi), par l'interface.
 * Usage : npx tsx e2e/visuel/lots/lot-c-paroisse-demandes/create-request.ts (après capture.ts, qui prépare la session).
 */
import path from 'node:path';
import { chromium } from '@playwright/test';

const STATE = path.resolve('e2e/visuel/resultats/lot-c-paroisse-demandes/.state.json');

const main = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ baseURL: 'http://localhost:3000', storageState: STATE, locale: 'fr-FR', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/app/demandes/nouvelle');
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: /continuer/i }).click();
  await page.getByLabel(/nom de la paroisse/i).fill('Dominique');
  await page.getByRole('radio').first().check({ timeout: 15_000 });
  await page.getByRole('button', { name: /continuer/i }).click();
  await page.getByLabel(/nom de famille/i).fill('Mendy');
  await page.getByLabel(/^prénoms/i).fill('Moussa');
  await page.getByLabel(/date de naissance/i).fill('14/03/1992');
  await page.getByLabel(/lieu de naissance/i).fill('Dakar');
  await page.getByLabel(/nom et prénoms du père/i).fill('Jean Mendy');
  await page.getByLabel(/nom de jeune fille de la mère/i).fill('Marie Gomis');
  await page.getByLabel(/téléphone/i).fill('+221 77 000 00 00');
  await page.getByLabel(/^année/i).fill('1992');
  await page.getByRole('radio', { name: /usage personnel|dossier paroissial/i }).first().check({ force: true });
  await page.getByRole('checkbox').last().check();
  await page.getByRole('button', { name: /voir le récapitulatif/i }).click();
  await page.getByRole('button', { name: /envoyer la demande/i }).click();
  await page.waitForURL(/\/app\/demandes\/[^/]+$/, { timeout: 20_000 });
  console.log('Demande créée :', page.url());
  await browser.close();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
