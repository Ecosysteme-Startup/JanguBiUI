import type { User } from '@/lib/auth';

// Gardes des écrans staff (paroisse, diocèse, plateforme) : les droits sont des
// CAPACITÉS exercées sur des NŒUDS de la hiérarchie (`GET /v1/me/capacites/`,
// exposées par `useUser()` dans `user.capabilities` et `user.capability_nodes`).
// Le back reste seul juge (403) ; ces gardes ne font que masquer l'inutile.

export type Capacite =
  | 'structure.gerer'
  | 'horaires.gerer'
  | 'offices.nommer'
  | 'personnes.verifier'
  | 'annonces.publier'
  | 'evenements.gerer'
  | 'actes.traiter'
  | 'actes.superviser'
  | 'messagerie.recevoir_fideles'
  | 'confessions.gerer'
  | 'confessions.voir_planning'
  | 'tableau_bord.voir'
  | 'audit.voir'
  | 'plateforme.admin'
  | 'dons.voir_fonds'
  | 'dons.gerer_fonds'
  | 'dons.saisir_quete'
  | 'dons.voir_donateurs'
  | 'dons.exporter'
  | 'dons.definir_quete_imperee'
  | 'dons.voir_agregats'
  | 'audio.publier'
  | 'audio.moderer'
  | 'paroissiens.gerer'
  | 'comptes.valider'
  | 'comptes.gerer'
  | 'intentions.gerer';

export type NoeudStaff = { id: string; name: string; type: string };

/** Vrai si la personne détient la capacité (sur au moins un nœud). */
export const aCapacite = (
  user: User | null | undefined,
  capacite: Capacite,
): boolean => !!user?.capabilities?.includes(capacite);

/** Vrai si la personne détient au moins une des capacités. */
export const aUneCapacite = (
  user: User | null | undefined,
  capacites: Capacite[],
): boolean => capacites.some((c) => aCapacite(user, c));

/** Prédicat pour `RoleGuard` / `AdminPageLayout allow`. */
export const peut =
  (...capacites: Capacite[]) =>
  (user: User | null | undefined): boolean =>
    aUneCapacite(user, capacites);

const RANG_TYPE: Record<string, number> = {
  province: 10,
  diocese: 20,
  zone: 30,
  doyenne: 40,
  paroisse: 50,
  quasi_paroisse: 55,
};

/**
 * Nœuds (sans doublon) où s'exerce une des capacités, du plus large au plus
 * local puis par nom. La capacité plateforme (hors arbre, `node_id` nul) n'y
 * figure pas.
 */
export const noeudsPour = (
  user: User | null | undefined,
  ...capacites: Capacite[]
): NoeudStaff[] => {
  const vus = new Map<string, NoeudStaff>();
  for (const c of user?.capability_nodes ?? []) {
    if (!capacites.includes(c.capacite as Capacite) || !c.node_id) continue;
    if (!vus.has(c.node_id))
      vus.set(c.node_id, {
        id: c.node_id,
        name: c.node_name,
        type: c.node_type,
      });
  }
  return [...vus.values()].sort(
    (a, b) =>
      (RANG_TYPE[a.type] ?? 99) - (RANG_TYPE[b.type] ?? 99) ||
      a.name.localeCompare(b.name, 'fr'),
  );
};

/** Libellé court d'un type de nœud. */
export const libelleTypeNoeud = (type: string): string =>
  ({
    province: 'Province',
    diocese: 'Diocèse',
    zone: 'Zone pastorale',
    doyenne: 'Doyenné',
    paroisse: 'Paroisse',
    quasi_paroisse: 'Quasi-paroisse',
    aumonerie: 'Aumônerie',
    ceb: 'CEB',
    mouvement: 'Mouvement',
  })[type] ?? type;
