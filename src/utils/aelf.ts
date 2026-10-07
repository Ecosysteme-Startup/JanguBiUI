import { z } from 'zod';

/**
 * Lecture AELF brute (`aelf`), transmise telle quelle par le backend : clés libres
 * (`titre`, `intro_lue`, `refrain_psalmique`, `ref_refrain`, `verset_evangile`, `ref_verset`…).
 * Rien n'est inventé côté client : une clé absente ou vide n'affiche rien.
 */
export const aelfLectureSchema = z.record(z.string(), z.unknown()).nullable().optional();
export type AelfLecture = z.infer<typeof aelfLectureSchema>;

/** Valeur texte d'une clé AELF, ou `null` (absente, vide ou non textuelle). */
export const aelfField = (aelf: AelfLecture, key: string): string | null => {
  const value = aelf?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
};

/** Éléments AELF d'une lecture : titre, introduction lue, refrain psalmique, acclamation de l'Évangile. */
export const aelfParts = (aelf: AelfLecture) => ({
  titre: aelfField(aelf, 'titre'),
  intro: aelfField(aelf, 'intro_lue'),
  refrain: aelfField(aelf, 'refrain_psalmique'),
  refRefrain: aelfField(aelf, 'ref_refrain'),
  acclamation: aelfField(aelf, 'verset_evangile'),
  refAcclamation: aelfField(aelf, 'ref_verset'),
});

/** Source des textes du jour, d'après `source` (et `edition` si le backend la précise). */
export const sourceLine = (source: string | undefined, edition?: { label: string } | null): string | null => {
  if (source === 'aelf') return 'Textes liturgiques : AELF.';
  if (source === 'crampon_refs') return edition?.label ? `Références AELF ; texte : ${edition.label}.` : 'Références AELF ; texte de la Bible locale.';
  return edition?.label ?? null;
};
