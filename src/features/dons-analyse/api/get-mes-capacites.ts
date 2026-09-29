import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// GET /v1/me/capacites/ : mes capacités et les nœuds où elles s'exercent.
// Sert à trouver le `noeud` des analyses (la paroisse de l'économe, le diocèse
// de l'économe diocésain) sans le demander à l'écran.

export const capaciteSchema = z.object({
  capacite: z.string(),
  node_id: z.string().nullable(),
  node_name: z.string(),
  node_type: z.string(),
  herite: z.boolean(),
  office: z.string(),
  office_label: z.string(),
});
export type Capacite = z.infer<typeof capaciteSchema>;

export const getMesCapacites = (): Promise<Capacite[]> =>
  api
    .get<unknown>('/v1/me/capacites/')
    .then((data) => z.array(capaciteSchema).parse(data));

export const useMesCapacites = () =>
  useQuery(
    queryOptions({
      queryKey: ['me', 'capacites'],
      queryFn: getMesCapacites,
      staleTime: 5 * 60_000,
      retry: false,
    }),
  );

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
): NoeudAnalyse | null => {
  const trouve = (capacites ?? []).find((c) =>
    niveau === 'paroisse'
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

export const useNoeudAnalyse = (niveau: 'paroisse' | 'diocese') => {
  const query = useMesCapacites();
  return { ...query, noeud: choisirNoeud(query.data, niveau) };
};
