// Indicateurs de fonctionnalité — écrans hérités SANS route backend (Phase 4).
//
// Règle : chaque écran appelle une vraie route du backend (`/api/v1/`). Quand
// aucune route n'existe, l'entrée est masquée (navigation, raccourcis, onglets)
// et la page affiche un état « pas encore disponible » au lieu de données
// fictives. Liste des routes manquantes : docs/BRANCHEMENT-FIDELE.md.
//
// Activation (recette ou développement, une fois la route livrée) :
//   NEXT_PUBLIC_FEATURES=tv,intentions
// `NEXT_PUBLIC_FEATURES=*` active tout (démonstration sur les mocks).

export const FEATURES = {
  /** TV catholique : aucune route `/tv/` côté backend. */
  tv: 'tv',
  /** Transfert paroissial : remplacé par les paroisses multiples (`/me/paroisses/`). */
  transfert: 'transfert',
  /** Assistant de questions : aucune route `/rag/`. */
  assistant: 'assistant',
  /** Liturgie des Heures : `/liturgy/v1/<office>/` gelée en V1 (« liturgy.heures »), clergé seulement. */
  heures: 'heures',
  /** Lectio divina : `/bible/lectio/` gelée en V1 (« bible.avance »). */
  lectio: 'lectio',
  /** Parcours de lecture : `/bible/reading-plans/` gelée en V1 (« bible.avance »). */
  parcours: 'parcours',
  /** Notes d'homélie : `/bible/homilenotes/` gelée en V1 (« bible.avance »). */
  notesHomelie: 'notes-homelie',
  /** Chapelet communautaire : `/rosary/community/` gelée en V1 (« rosary.communautaire »). */
  chapeletCommunautaire: 'chapelet-communautaire',
  /** Pièces jointes envoyées dans la messagerie : aucune route d'envoi. */
  piecesJointesMessagerie: 'pj-messagerie',
  /** Résumé du fidèle sur l'accueil : aucune route `/dashboards/me/`. */
  resumeFidele: 'resume-fidele',
  /** Réflexion pastorale du jour : aucune route `/spiritual/reflections/`. */
  reflexionPastorale: 'reflexion-pastorale',
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

const lireActives = (): Set<string> =>
  new Set(
    (process.env.NEXT_PUBLIC_FEATURES ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

/** Vrai si la fonctionnalité est activée par `NEXT_PUBLIC_FEATURES`. */
export const isFeatureEnabled = (feature: Feature): boolean => {
  const actives = lireActives();
  return actives.has('*') || actives.has(feature);
};
