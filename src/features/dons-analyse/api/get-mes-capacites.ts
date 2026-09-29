import { type Grant, useCapacites } from '@/lib/capacites';

// Capacités de la personne (`GET /me/capacites/`, requête partagée avec la
// coquille) : le `noeud` des analyses (la paroisse de l'économe, le diocèse de
// l'économe diocésain) en découle.

export type Capacite = Grant;

export const useMesCapacites = useCapacites;

export type NoeudAnalyse = { id: string; nom: string; type: string };

/**
 * Nœud d'analyse : paroisse avec `dons.voir_fonds` par une nomination sur la
 * paroisse même (contrat §2.2 : un droit venu du diocèse ne suffit pas, il
 * porterait `node_type: diocese`) ; diocèse ou doyenné avec
 * `dons.voir_agregats`. `herite` n'entre pas en compte : il dit seulement que
 * l'office s'étend aux nœuds enfants (vrai pour le curé et l'économe).
 */
export const choisirNoeud = (
  capacites: Capacite[] | undefined,
  niveau: 'paroisse' | 'diocese',
  nodeId?: string,
): NoeudAnalyse | null => {
  const trouve = (capacites ?? []).find((c) =>
    nodeId && c.node_id !== nodeId
      ? false
      : niveau === 'paroisse'
        ? c.capacite === 'dons.voir_fonds' &&
          (c.node_type === 'paroisse' || c.node_type === 'quasi_paroisse') &&
          c.node_id
        : c.capacite === 'dons.voir_agregats' &&
          (c.node_type === 'diocese' || c.node_type === 'doyenne') &&
          c.node_id,
  );
  return trouve?.node_id
    ? { id: trouve.node_id, nom: trouve.node_name, type: trouve.node_type }
    : null;
};

/** Nœud d'analyse de l'espace `/espace/[nodeId]` (`nodeId` absent : le premier trouvé). */
export const useNoeudAnalyse = (
  niveau: 'paroisse' | 'diocese',
  nodeId?: string,
) => {
  const query = useMesCapacites();
  return { ...query, noeud: choisirNoeud(query.data, niveau, nodeId) };
};
