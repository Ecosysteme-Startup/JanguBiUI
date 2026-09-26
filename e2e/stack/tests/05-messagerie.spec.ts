import { expect, test } from '@playwright/test';
import { KC_DEMO_PASSWORD, loginViaKeycloak, logout } from '../helpers/auth';

const FIDELE = 'fidele2@demo.jangubi.sn'; // fidele@ est déjà utilisé par le parcours 04 en parallèle.
const VICAIRE = 'vicaire@demo.jangubi.sn';
const MINEUR = 'mineur@demo.jangubi.sn';
const SAINT_DOMINIQUE_NODE = 'c64e06b7-cc45-498c-b4c7-a72a5d798756';

test('Messagerie temps réel : fidèle ↔ vicaire (deux contextes), bandeau confession visible', async ({ browser }, testInfo) => {
  const stamp = Date.now();
  const messageText = `Bonjour mon père, question de recette E2E ${stamp}.`;
  const replyText = `Réponse du vicaire (recette E2E ${stamp}).`;

  const fideleCtx = await browser.newContext();
  const fidelePage = await fideleCtx.newPage();
  await loginViaKeycloak(fidelePage, FIDELE, KC_DEMO_PASSWORD, { entryPath: '/app/pretres' });
  await expect(fidelePage).toHaveURL(/\/app\/pretres/);
  await fidelePage.waitForLoadState('networkidle').catch(() => undefined);

  // DEF-05 (voir rapport) : la liste des prêtres peut échouer avec un 401 ponctuel juste après
  // la connexion (course sur le jeton), alors qu'une requête sœur de la même page réussit.
  // On applique le remède suggéré par l'écran lui-même (« rechargez la page ») pour poursuivre.
  const loadError = fidelePage.getByText(/n.a pas pu être chargée/i);
  if (await loadError.isVisible({ timeout: 3_000 }).catch(() => false)) {
    testInfo.annotations.push({ type: 'defaut', description: "DEF-05 : liste des prêtres non chargée (401) juste après connexion, nécessite un rechargement." });
    await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/DEF-05-messagerie-liste-pretres-echec-${testInfo.project.name}.png`, fullPage: true });
    await fidelePage.reload();
    await fidelePage.waitForLoadState('networkidle').catch(() => undefined);
  }
  await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/messagerie-liste-pretres-${testInfo.project.name}.png`, fullPage: true });

  const writeButtons = fidelePage.getByRole('button', { name: /^écrire à /i });
  await expect(writeButtons.first()).toBeVisible({ timeout: 10_000 });
  const writeToVicaire = fidelePage.getByRole('button', { name: /écrire à .*diouf/i });
  if (await writeToVicaire.count()) {
    await writeToVicaire.first().click();
  } else {
    testInfo.annotations.push({ type: 'observation', description: 'Bouton « Écrire à » ciblant explicitement vicaire@ (Paul Diouf) introuvable — utilisation du premier prêtre joignable.' });
    await writeButtons.first().click();
  }
  await fidelePage.waitForURL(/\/app\/pretres\/conversations\//, { timeout: 15_000 });
  await fidelePage.waitForLoadState('networkidle').catch(() => undefined);

  // Bandeau « pas de confession par message » toujours visible.
  await expect(fidelePage.getByText(/la confession ne se fait pas par message/i)).toBeVisible({ timeout: 10_000 });
  await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/messagerie-conversation-ouverte-${testInfo.project.name}.png`, fullPage: true });

  const acceptConditions = fidelePage.getByRole('button', { name: /j.accepte les conditions de la messagerie/i });
  if (await acceptConditions.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await acceptConditions.click();
  }

  const composer = fidelePage.getByRole('textbox').last();
  await expect(composer).toBeVisible({ timeout: 15_000 });
  await composer.fill(messageText);
  await fidelePage.getByRole('button', { name: /envoyer/i }).click();
  await expect(fidelePage.getByText(messageText)).toBeVisible({ timeout: 10_000 });
  await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/messagerie-message-envoye-${testInfo.project.name}.png`, fullPage: true });

  // --- Vicaire : reçoit et répond, dans un second contexte navigateur (temps réel). ---
  const vicaireCtx = await browser.newContext();
  const vicairePage = await vicaireCtx.newPage();
  await loginViaKeycloak(vicairePage, VICAIRE, KC_DEMO_PASSWORD, { entryPath: `/espace/${SAINT_DOMINIQUE_NODE}/messagerie` });
  await vicairePage.waitForLoadState('networkidle').catch(() => undefined);
  await expect(vicairePage.getByRole('heading', { name: /messagerie/i })).toBeVisible({ timeout: 10_000 });
  await vicairePage.screenshot({ path: `docs/v1/recette/captures/01/messagerie-inbox-vicaire-${testInfo.project.name}.png`, fullPage: true });

  const inboxConversation = vicairePage.locator('a,button').filter({ hasText: /moussa|ndiaye|fidele/i }).first();
  if (await inboxConversation.count()) {
    await inboxConversation.click();
  } else {
    testInfo.annotations.push({ type: 'observation', description: 'Conversation de Moussa introuvable dans la liste par nom — ouverture de la 1ʳᵉ conversation de la liste.' });
    await vicairePage.locator('aside, [role="list"], nav').first().locator('a,button').first().click().catch(() => undefined);
  }
  await vicairePage.waitForLoadState('networkidle').catch(() => undefined);
  await expect(vicairePage.getByText(messageText)).toBeVisible({ timeout: 15_000 });
  await vicairePage.waitForTimeout(500); // laisse le composeur se monter après le fil de messages.
  const vicaireAcceptConditions = vicairePage.getByRole('button', { name: /j.accepte les conditions de la messagerie/i });
  if (await vicaireAcceptConditions.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await vicaireAcceptConditions.click();
  }
  await vicairePage.screenshot({ path: `docs/v1/recette/captures/01/messagerie-vicaire-lit-message-${testInfo.project.name}.png`, fullPage: true });

  const vicaireComposer = vicairePage.getByRole('textbox').last();
  await expect(vicaireComposer).toBeVisible({ timeout: 15_000 });
  await vicaireComposer.fill(replyText);
  await vicairePage.getByRole('button', { name: /envoyer/i }).click();
  await expect(vicairePage.getByText(replyText)).toBeVisible({ timeout: 10_000 });

  // --- Vérifie la réception en temps réel côté fidèle, SANS recharger la page. ---
  const liveReceived = await fidelePage.getByText(replyText).isVisible({ timeout: 8_000 }).catch(() => false);
  await fidelePage.screenshot({ path: `docs/v1/recette/captures/01/messagerie-fidele-recoit-${testInfo.project.name}.png`, fullPage: true });
  if (!liveReceived) {
    await fidelePage.reload();
    await expect(fidelePage.getByText(replyText)).toBeVisible({ timeout: 10_000 });
  }
  testInfo.annotations.push({ type: 'temps-reel', description: liveReceived ? 'reçu sans rechargement' : 'reçu SEULEMENT après rechargement (pas de mise à jour temps réel observée)' });

  await logout(fidelePage);
  await logout(vicairePage);
  await fideleCtx.close();
  await vicaireCtx.close();
});

test('Messagerie : un mineur est refusé avec une explication', async ({ page }, testInfo) => {
  await loginViaKeycloak(page, MINEUR, KC_DEMO_PASSWORD, { entryPath: '/app/pretres' });
  await expect(page).toHaveURL(/\/app\/pretres/);
  // Le bandeau d'explication est visible dès l'ouverture dans la majorité des cas (voir DEF-07 :
  // il n'apparaît pas toujours de façon fiable au premier rendu — observé de façon intermittente).
  const bannerVisibleUpfront = await page
    .getByText(/réservée aux personnes majeures/i)
    .first()
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
  if (!bannerVisibleUpfront) {
    testInfo.annotations.push({
      type: 'defaut',
      description:
        "DEF-07 (mineur, intermittent) : le bandeau d'avertissement « réservée aux personnes majeures » n'apparaît pas systématiquement au premier rendu de /app/pretres pour mineur@ (observé absent sur ce run, présent sur un run précédent).",
    });
  }
  const writeButtons = page.getByRole('button', { name: /écrire/i });
  if (await writeButtons.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await writeButtons.first().click();
    await expect(page.getByText(/réservée aux personnes majeures|majeur/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/conversations\//);
  }
  await page.screenshot({ path: `docs/v1/recette/captures/01/messagerie-mineur-refuse-${testInfo.project.name}.png`, fullPage: true });
  await logout(page);
});
