import { writeFileSync, mkdirSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { AUDIT_OUT } from '../playwright.audit.config';
import { clientNav, warmSession } from '../helpers/nav';
import { focusInfo, tabTo, tabWalk, type FocusInfo } from '../helpers/keyboard';
import { IDS, statePath } from '../helpers/screens';

/**
 * Recette 03 — navigation au clavier des éléments clés (plan §4) : menu mobile, sélecteur de
 * contexte, arbre de structure, modales, combobox de personne, grille Semaine de l'agenda.
 * Chaque test consigne ses observations dans AUDIT_OUT/keyboard/<id>.json et vérifie en « soft ».
 */
mkdirSync(`${AUDIT_OUT}/keyboard`, { recursive: true });
const log = (id: string, data: unknown) => writeFileSync(`${AUDIT_OUT}/keyboard/${id}.json`, JSON.stringify(data, null, 2));

async function openAs(browser: Browser, persona: string, path: string, width = 1440): Promise<Page> {
  const ctx = await browser.newContext({ storageState: statePath(persona), viewport: { width, height: width < 768 ? 812 : 900 }, locale: 'fr-FR' });
  const page = await ctx.newPage();
  await warmSession(page);
  await clientNav(page, path);
  await resetFocus(page);
  return page;
}

/** Remet le point de départ de la navigation séquentielle en haut du document. */
async function resetFocus(page: Page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement | null)?.blur();
    document.body.tabIndex = -1;
    document.body.focus();
    document.body.removeAttribute('tabindex');
  });
}

// `nextjs-portal` = indicateur du serveur de dev Next, absent en production : ignoré.
const missingIndicators = (trail: FocusInfo[]) => trail.filter((f) => !['body', 'nextjs-portal'].includes(f.desc) && !f.visible).map((f) => f.desc);

test('K1 — menu mobile « Plus » (fidèle, 375 px)', async ({ browser }) => {
  const page = await openAs(browser, 'fidele', '/app', 375);
  const first = await tabWalk(page, 1);
  const skipVisible = await page.locator('a[href="#contenu"]').first().evaluate((a) => a.getBoundingClientRect().width > 2);
  const reach = await tabTo(page, /Ouvrir le menu/);
  expect.soft(reach, 'bouton menu atteignable au clavier').not.toBeNull();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const dialogOpen = await page.getByRole('dialog').isVisible();
  const afterOpen = await focusInfo(page);
  const inside = await tabWalk(page, 25);
  const escaped = inside.filter((f) => !f.inDialog).map((f) => f.desc);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const closed = !(await page.getByRole('dialog').isVisible().catch(() => false));
  const back = await focusInfo(page);
  log('K1-menu-mobile', { first, skipVisible, reachSteps: reach?.steps, trailToMenu: reach?.trail, dialogOpen, afterOpen, inside, escaped, closed, back });
  expect.soft(first[0].desc, 'premier arrêt = lien d’évitement').toMatch(/Aller au contenu/);
  expect.soft(dialogOpen, 'Entrée ouvre le menu').toBe(true);
  expect.soft(afterOpen.inDialog, 'focus déplacé dans le menu').toBe(true);
  expect.soft(escaped, 'focus piégé dans le menu').toEqual([]);
  expect.soft(missingIndicators(inside), 'focus visible dans le menu').toEqual([]);
  expect.soft(closed, 'Échap ferme le menu').toBe(true);
  expect.soft(back.desc, 'focus rendu au déclencheur').toMatch(/Ouvrir le menu/);
});

test('K1b — ordre de tabulation et focus visible (fidèle desktop /app)', async ({ browser }) => {
  const page = await openAs(browser, 'fidele', '/app', 1440);
  const trail = await tabWalk(page, 40);
  log('K1b-ordre-fidele', { trail });
  expect.soft(trail[0].desc).toMatch(/Aller au contenu/);
  expect.soft(missingIndicators(trail), 'arrêts sans indicateur de focus').toEqual([]);
});

test('K2 — sélecteur de contexte du back-office (curé)', async ({ browser }) => {
  const res: Record<string, unknown> = {};
  for (const width of [1440, 375]) {
    const page = await openAs(browser, 'cure', `/espace/${IDS.paroisse}`, width);
    const trigger = page.locator('button[aria-haspopup="menu"]').first();
    const label = ((await trigger.getAttribute('aria-label')) ?? (await trigger.innerText())).replace(/\s+/g, ' ').trim();
    const reach = await tabTo(page, new RegExp(label.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const menuOpen = await page.getByRole('menu').isVisible().catch(() => false);
    const onOpen = await focusInfo(page);
    await page.keyboard.press('ArrowDown');
    const afterDown = await focusInfo(page);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closed = !(await page.getByRole('menu').isVisible().catch(() => false));
    const back = await focusInfo(page);
    res[width] = { label, reachSteps: reach?.steps, trail: reach?.trail, menuOpen, onOpen, afterDown, closed, back };
    expect.soft(reach, `déclencheur atteignable (${width})`).not.toBeNull();
    expect.soft(menuOpen, `Entrée ouvre le menu (${width})`).toBe(true);
    expect.soft(onOpen.desc, `focus sur un élément du menu (${width})`).toMatch(/^menuitem/);
    expect.soft(closed, `Échap ferme (${width})`).toBe(true);
    expect.soft(back.desc, `focus rendu au déclencheur (${width})`).toContain(label.slice(0, 10));
    expect.soft(missingIndicators([onOpen, afterDown, back]), `focus visible (${width})`).toEqual([]);
    await page.context().close();
  }
  log('K2-selecteur-contexte', res);
});

test('K3 — arbre de structure (chancelier)', async ({ browser }) => {
  const page = await openAs(browser, 'chancelier', `/espace/${IDS.diocese}/structure`);
  await page.getByRole('tree').first().waitFor({ timeout: 15_000 });
  const reach = await tabTo(page, /^treeitem/, 80);
  expect.soft(reach, 'arbre atteignable par Tab').not.toBeNull();
  const start = await focusInfo(page);
  const expandedBefore = await page.evaluate(() => document.activeElement?.getAttribute('aria-expanded'));
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const expandedAfterRight = await page.evaluate(() => document.activeElement?.getAttribute('aria-expanded'));
  await page.keyboard.press('ArrowDown');
  const down = await focusInfo(page);
  await page.keyboard.press('ArrowUp');
  const up = await focusInfo(page);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  const expandedAfterLeft = await page.evaluate(() => document.activeElement?.getAttribute('aria-expanded'));
  await page.keyboard.press('End');
  const end = await focusInfo(page);
  await page.keyboard.press('Home');
  const home = await focusInfo(page);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const selected = await page.evaluate(() => document.activeElement?.getAttribute('aria-selected'));
  // Un seul arrêt de tabulation dans l'arbre (roving tabindex).
  await page.keyboard.press('Tab');
  const afterTab = await focusInfo(page);
  const tabStops = await page.locator('[role=tree] [tabindex="0"]').count();
  log('K3-arbre', { reachSteps: reach?.steps, start, expandedBefore, expandedAfterRight, down, up, expandedAfterLeft, end, home, selected, afterTab, tabStops });
  expect.soft(start.visible, 'focus visible sur le nœud').toBe(true);
  expect.soft(down.desc, 'Flèche bas change de nœud').not.toBe(start.desc);
  expect.soft(up.desc, 'Flèche haut revient au nœud précédent').not.toBe(down.desc);
  expect.soft(home.desc, 'Début revient à la racine').toBe(start.desc);
  expect.soft(tabStops, 'un seul arrêt de tabulation').toBe(1);
  expect.soft(afterTab.desc.startsWith('treeitem'), 'Tab sort de l’arbre').toBe(false);
});

test('K4/K5 — panneau de nomination, combobox de personne et modale (curé /equipe)', async ({ browser }) => {
  const page = await openAs(browser, 'cure', `/espace/${IDS.paroisse}/equipe`);
  const res: Record<string, unknown> = {};
  // Panneau « Nommer »
  const reach = await tabTo(page, /Nommer/i, 80);
  res.reachNommer = reach?.steps;
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  res.panelFocus = await focusInfo(page);
  res.panelIsDialog = await page.locator('#panneau-nomination').evaluate((e) => e.closest('[role=dialog]') !== null || e.getAttribute('role')).catch(() => 'absent');
  // Combobox
  const combo = page.getByRole('combobox').first();
  if (await combo.count()) {
    await combo.focus();
    await combo.pressSequentially('sa', { delay: 80 });
    await page.waitForTimeout(1200);
    res.expandedAfterType = await combo.getAttribute('aria-expanded');
    res.listbox = await page.getByRole('listbox').isVisible().catch(() => false);
    res.options = await page.getByRole('option').count();
    await page.keyboard.press('ArrowDown');
    res.activeDesc = await combo.getAttribute('aria-activedescendant');
    res.activeOption = res.activeDesc
      ? await page.locator(`[id="${res.activeDesc}"]`).evaluate((o) => ({ text: (o as HTMLElement).innerText.slice(0, 60), selected: o.getAttribute('aria-selected') }))
      : null;
    res.comboFocus = await focusInfo(page);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    res.expandedAfterEsc = await combo.getAttribute('aria-expanded');
    res.panelStillOpen = await page.locator('#panneau-nomination').isVisible().catch(() => false);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    res.panelAfterSecondEsc = await page.locator('#panneau-nomination').isVisible().catch(() => false);
    res.focusAfterPanelClose = await focusInfo(page);
  } else {
    res.combobox = 'absent';
  }
  // Modale « Terminer la nomination »
  await resetFocus(page);
  const endBtn = page.getByRole('button', { name: /Terminer la nomination/ }).first();
  if (await endBtn.count()) {
    await endBtn.focus();
    const trigger = await focusInfo(page);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    res.modalOpen = await page.getByRole('dialog').isVisible();
    res.modalFocus = await focusInfo(page);
    const inside = await tabWalk(page, 12);
    res.modalTrail = inside;
    res.modalEscaped = inside.filter((f) => !f.inDialog).map((f) => f.desc);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    res.modalClosed = !(await page.getByRole('dialog').isVisible().catch(() => false));
    res.modalBack = await focusInfo(page);
    res.trigger = trigger;
    expect.soft(res.modalEscaped, 'focus piégé dans la modale').toEqual([]);
    expect.soft(res.modalClosed, 'Échap ferme la modale').toBe(true);
    expect.soft((res.modalBack as FocusInfo).desc, 'focus rendu au bouton').toBe(trigger.desc);
    expect.soft(missingIndicators(inside), 'focus visible dans la modale').toEqual([]);
  } else res.modal = 'aucun bouton « Terminer la nomination »';
  log('K4-K5-equipe', res);
  expect.soft(res.listbox, 'la combobox propose des personnes').toBe(true);
  expect.soft(res.activeDesc, 'Flèche bas active une option').toBeTruthy();
  expect.soft(res.expandedAfterEsc, 'Échap ferme la liste').toBe('false');
  expect.soft(res.panelStillOpen, 'le premier Échap ne ferme que la liste').toBe(true);
});

test('K6 — agenda, vue Semaine (curé)', async ({ browser }) => {
  const page = await openAs(browser, 'cure', `/espace/${IDS.paroisse}/agenda`);
  const res: Record<string, unknown> = {};
  const reach = await tabTo(page, /^radio/, 80);
  res.reachRadio = reach?.steps;
  res.radioFocus = await focusInfo(page);
  // Motif radiogroup attendu : les flèches déplacent ET sélectionnent.
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  res.afterArrow = await focusInfo(page);
  res.semaineCheckedByArrow = await page.getByRole('radio', { name: 'Semaine' }).getAttribute('aria-checked');
  // Repli : Tab jusqu'à « Semaine » puis Espace.
  if (res.semaineCheckedByArrow !== 'true') {
    await page.getByRole('radio', { name: 'Semaine' }).focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
  }
  res.onSemaine = await focusInfo(page);
  res.semaineChecked = await page.getByRole('radio', { name: 'Semaine' }).getAttribute('aria-checked');
  res.weekSection = await page.locator('section[aria-label*="vue semaine"]').count();
  // Semaine sans événement : on avance (bouton « Semaine suivante ») jusqu'à en trouver, au plus 4 fois.
  for (let i = 0; i < 4 && (await page.locator('section[aria-label*="vue semaine"] button').count()) === 0; i += 1) {
    await page.getByRole('button', { name: /Semaine suivante/ }).click();
    await page.waitForTimeout(900);
  }
  res.weekLabel = await page.locator('section[aria-label*="vue semaine"]').getAttribute('aria-label');
  res.eventsInWeek = await page.locator('section[aria-label*="vue semaine"] button').count();
  await page.locator('section[aria-label*="vue semaine"]').evaluate((s) => {
    const b = s.querySelector('button');
    (b ?? s).scrollIntoView();
  });
  await page.getByRole('button', { name: /Semaine suivante/ }).focus();
  const trail = await tabWalk(page, 25);
  res.trail = trail;
  res.eventStops = trail.filter((f) => /aria-pressed|button/.test(f.desc)).length;
  res.missing = missingIndicators(trail);
  // Enter sur un événement : ouvre-t-il un détail ? Échap le ferme-t-il ?
  const ev = page.locator('section[aria-label*="vue semaine"] button').first();
  if (await ev.count()) {
    await ev.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    res.afterEnter = await focusInfo(page);
    res.dialogAfterEnter = await page.getByRole('dialog').isVisible().catch(() => false);
    res.pressed = await ev.getAttribute('aria-pressed');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    res.afterEsc = await focusInfo(page);
    res.pressedAfterEsc = await ev.getAttribute('aria-pressed');
  } else res.events = 'aucun événement dans la semaine';
  // Largeur mobile : la grille reste-t-elle utilisable ?
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  res.mobile = await page.locator('section[aria-label*="vue semaine"]').evaluate((s) => ({ scrollWidth: s.scrollWidth, clientWidth: s.clientWidth, tabindex: s.getAttribute('tabindex') })).catch(() => null);
  log('K6-agenda-semaine', res);
  expect.soft(res.semaineCheckedByArrow, 'flèches du groupe radio sélectionnent « Semaine »').toBe('true');
  expect.soft(res.weekSection, 'vue Semaine affichée').toBe(1);
  expect.soft(res.missing, 'focus visible dans la grille').toEqual([]);
});
