// Règles d'ordre des tableaux de bord (décisions du 27/09) :
// - paroisses toujours par ordre alphabétique, jamais par montant ;
// - « À traiter » par échéance, la plus proche en premier.

const collator = new Intl.Collator('fr', { sensitivity: 'base' });

/** Tri alphabétique français stable, sans tenir compte des accents ni de la casse. */
export const trierAlphabetique = <T>(
  items: readonly T[],
  cle: (item: T) => string,
): T[] => [...items].sort((a, b) => collator.compare(cle(a), cle(b)));

/** Tri par échéance croissante ; à échéance égale, l'ordre reçu est conservé. */
export const trierParEcheance = <T extends { echeance: string }>(
  items: readonly T[],
): T[] =>
  [...items].sort(
    (a, b) => new Date(a.echeance).getTime() - new Date(b.echeance).getTime(),
  );
