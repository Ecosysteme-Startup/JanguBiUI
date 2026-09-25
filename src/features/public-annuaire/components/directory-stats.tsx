'use client';

import { EXCERPT_PARAMS, useDioceses, useDirectory } from '../api/get-directory';

/** « 7 diocèses · 172 paroisses » (bandeau de l'accueil), d'après l'annuaire. */
export const DirectoryStats = () => {
  const dioceses = useDioceses();
  const parishes = useDirectory(EXCERPT_PARAMS);
  if (!dioceses.data || !parishes.data) return null;
  const d = dioceses.data.count;
  const p = parishes.data.count;
  return (
    <span>
      {d} diocèse{d > 1 ? 's' : ''} · {p} paroisse{p > 1 ? 's' : ''}
    </span>
  );
};
