import axe from 'axe-core';

/**
 * Audit axe (WCAG 2.1 A/AA) du DOM rendu. Sous jsdom, le contraste (pas de rendu) et les
 * régions (les tests rendent des écrans sans le shell) ne sont pas mesurables : désactivés ici,
 * vérifiés par Playwright + @axe-core/playwright sur les vraies pages.
 */
export const a11yViolations = async (root: Element = document.body) => {
  // Radix (modales, menus) rend l'arrière-plan aria-hidden et pose des sentinelles de focus
  // tant qu'une couche est ouverte : le focus y est piégé, ce n'est pas un défaut.
  const context = { include: [root], exclude: [['[data-radix-focus-guard]'], ['[data-aria-hidden="true"]']] };
  const result = await axe.run(context, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  return result.violations.map((v) => `${v.id} (${v.impact}) : ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
};
