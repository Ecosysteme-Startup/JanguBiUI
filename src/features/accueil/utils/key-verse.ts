type Verse = { book: string; chapter: number; number: number; text: string };
type Reading = { type: string; verses: Verse[] };

/**
 * Verset en exergue de « La Parole du jour » (FID-Accueil) : l'API ne désigne pas de verset clé,
 * on prend le premier verset de l'Évangile, sinon celui de la première lecture qui a un texte.
 * `null` quand le jour n'a que des références (aucun texte à citer).
 */
export const keyVerse = (readings: Reading[]): { text: string; reference: string } | null => {
  const ordered = [...readings.filter((r) => r.type === 'evangile'), ...readings.filter((r) => r.type !== 'evangile')];
  for (const reading of ordered) {
    const first = reading.verses.find((v) => v.text.trim());
    if (first) return { text: first.text.trim(), reference: `${first.book} ${first.chapter}, ${first.number}` };
  }
  return null;
};
