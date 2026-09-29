import { paths } from '@/config/paths';

/** Lien vers un chapitre de la Bible (onglet Bible), au verset voulu. */
export const lienBible = ({
  livreId,
  chapitre,
  verset,
}: {
  livreId: number;
  chapitre: number;
  verset?: number | null;
}): string => {
  const params = new URLSearchParams({
    tab: 'bible',
    livre: String(livreId),
    chapitre: String(chapitre),
  });
  if (verset) params.set('verset', String(verset));
  return `${paths.app.bible.getHref()}?${params.toString()}`;
};

/** Lit `livre`, `chapitre`, `verset` d'une URL de la Bible. */
export const lireLienBible = (get: (cle: string) => string | null) => {
  const livreId = Number(get('livre'));
  const chapitre = Number(get('chapitre'));
  const verset = Number(get('verset'));
  if (!Number.isInteger(livreId) || livreId <= 0) return null;
  return {
    livreId,
    chapitre: Number.isInteger(chapitre) && chapitre > 0 ? chapitre : 1,
    verset: Number.isInteger(verset) && verset > 0 ? verset : null,
  };
};
