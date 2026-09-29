import type { TypeFonds } from '../api/get-analyse-dons';

// Palette données, ordre fixe jamais permuté (spec 03 §1.2). Les couleurs sont
// des variables CSS (globals.css) pour suivre le thème ; elles ne servent qu'aux
// marques (pastilles, segments, colonnes), jamais au texte.
export const ORDRE_FONDS: readonly TypeFonds[] = [
  'quete_dominicale',
  'quete_imperee',
  'campagne',
  'contribution_annuelle',
  'autres',
];

export const COULEUR_FONDS: Record<TypeFonds, string> = {
  quete_dominicale: 'var(--dv-fonds-1)',
  quete_imperee: 'var(--dv-fonds-2)',
  campagne: 'var(--dv-fonds-3)',
  contribution_annuelle: 'var(--dv-fonds-4)',
  autres: 'var(--dv-fonds-5)',
};

export const LIBELLE_FONDS: Record<TypeFonds, string> = {
  quete_dominicale: 'Quête dominicale',
  quete_imperee: 'Quête impérée',
  campagne: 'Campagnes',
  contribution_annuelle: 'Contribution annuelle',
  autres: 'Autres',
};

/** Statuts de paiement : couleurs d'état technique, jamais une série de données. */
export const STATUTS_PAIEMENT = [
  { cle: 'confirmes', libelle: 'Confirmé', couleur: 'var(--dv-statut-ok)' },
  {
    cle: 'en_attente',
    libelle: 'En attente',
    couleur: 'var(--dv-statut-attente)',
  },
  { cle: 'echoues', libelle: 'Échoué', couleur: 'var(--dv-statut-echec)' },
  { cle: 'expires', libelle: 'Expiré', couleur: 'var(--dv-statut-expire)' },
] as const;

export type CleStatut = (typeof STATUTS_PAIEMENT)[number]['cle'];

/** Trie des entrées par fonds dans l'ordre canonique. */
export const ordonnerParFonds = <T extends { type: TypeFonds }>(
  items: readonly T[],
): T[] =>
  [...items].sort(
    (a, b) => ORDRE_FONDS.indexOf(a.type) - ORDRE_FONDS.indexOf(b.type),
  );
