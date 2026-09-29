// Indicateurs de fonctionnalités des écrans hérités SANS route backend V1
// (docs/BRANCHEMENT-STAFF.md, « Routes manquantes »). Tant que la route
// n'existe pas, l'entrée est masquée : aucun écran n'affiche de données
// fictives en mode réel.
//
// Activation (recette, démonstration) : `NEXT_PUBLIC_FEATURES=cle1,cle2`.
// Le mode mocks (`NEXT_PUBLIC_API_MOCKING=true`) ne les active pas : ces écrans
// n'ont pas de mocks alignés sur un contrat qui n'existe pas.

export const ROUTES_MANQUANTES = {
  /** Transferts paroissiaux (file et décisions). */
  transferts: [
    'GET /v1/transfers/admin/',
    'POST /v1/transfers/{id}/approve|reject|acknowledge/',
  ],
  /** Messagerie entre membres du clergé. */
  messagerieClericale: [
    'GET /v1/messaging/clerical/inbox/',
    'POST /v1/messaging/clerical/',
  ],
  /** JanguBi TV (vidéos et catégories). */
  jangubiTv: [
    'GET/POST/PATCH/DELETE /v1/tv/videos/',
    'GET/POST /v1/tv/categories/',
  ],
  /** Réflexion pastorale du prêtre (partagée aux fidèles). */
  reflexionPastorale: [
    'GET/POST /v1/spiritual/reflections/',
    'PATCH /v1/spiritual/reflections/{id}/',
  ],
  /** Analytique « activité » (séries par jour, cohortes). */
  analytiqueActivite: [
    'GET /v1/dashboards/analytics/',
    'GET /v1/dashboards/analytics/activity/',
  ],
} as const;

export type Fonctionnalite = keyof typeof ROUTES_MANQUANTES;

const activees = (): Set<string> =>
  new Set(
    (process.env.NEXT_PUBLIC_FEATURES ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

/** Vrai si la fonctionnalité sans route a été explicitement activée. */
export const fonctionnaliteActive = (cle: Fonctionnalite): boolean =>
  activees().has(cle);
