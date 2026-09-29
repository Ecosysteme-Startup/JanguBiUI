/**
 * Graduations « rondes » (3 à 5) de 0 au-dessus du maximum :
 * 761 → [0, 200, 400, 600, 800] ; 38 → [0, 20, 40].
 */
export const graduations = (max: number, cible = 4): number[] => {
  if (max <= 0) return [0, 1];
  const brut = max / cible;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas =
    [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut) ??
    10 * puissance;
  const n = Math.ceil(max / pas);
  return Array.from(
    { length: n + 1 },
    (_, i) => Math.round(i * pas * 1000) / 1000,
  );
};
