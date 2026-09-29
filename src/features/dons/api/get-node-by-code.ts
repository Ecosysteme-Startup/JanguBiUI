import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api, ApiError } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

/**
 * Nœud public résolu par son code d'URL (`/paroisses/DAK-SAINT-DOMINIQUE/don`) : seuls les champs
 * utiles à l'en-tête du don (WEB-Don-Paroisse). Même endpoint que la fiche paroisse, relu ici pour
 * ne pas importer une autre feature.
 */
const nodeByCodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  parent_name: z.string().nullable(),
  diocese_name: z.string().nullable(),
});
export type NodeByCode = z.infer<typeof nodeByCodeSchema>;

type _NodeKeys = Expect<Matches<Exclude<keyof NodeByCode, keyof ResponseBody<'v1_public_nodes_by_code_retrieve'>>, never>>;

/** `null` : code inconnu (404). */
export const getNodeByCode = async (code: string): Promise<NodeByCode | null> => {
  const wanted = code.trim();
  if (!wanted) return null;
  try {
    return nodeByCodeSchema.parse(await api.get(`/public/nodes/by-code/${encodeURIComponent(wanted)}/`));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

export const nodeByCodeQueryOptions = (code: string) =>
  queryOptions({ queryKey: ['dons', 'noeud', code], queryFn: () => getNodeByCode(code), staleTime: 5 * 60 * 1000 });

export const useNodeByCode = (code: string) => useQuery(nodeByCodeQueryOptions(code));
