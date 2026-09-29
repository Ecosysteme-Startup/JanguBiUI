const numberFormat = new Intl.NumberFormat('fr-FR');

/**
 * Accord en nombre, règle française : singulier pour 0 et 1, pluriel au-delà.
 * `plural(1, 'demande', 'demandes')` → « 1 demande » ; `plural(1480, …)` → « 1 480 demandes »
 * (espace fine insécable des milliers).
 */
export const plural = (count: number, one: string, many: string): string =>
  `${numberFormat.format(count)} ${pluralWord(count, one, many)}`;

/** Le mot seul, accordé, quand le nombre est affiché à part (« 3 / 12 places »). */
export const pluralWord = (count: number, one: string, many: string): string => (Math.abs(count) > 1 ? many : one);
