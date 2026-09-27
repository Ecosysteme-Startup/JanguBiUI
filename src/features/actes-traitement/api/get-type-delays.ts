import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/** Délais indicatifs par type d'acte (GET /staff/documents/nodes/{id}/type-delays/, lecture seule ici). */
const typeDelaysSchema = z.object({
  node_id: z.string(),
  default_days: z.number(),
  items: z.array(z.object({ document_type: z.string(), document_type_label: z.string(), days: z.number().nullable() })),
});
export type TypeDelays = z.infer<typeof typeDelaysSchema>;

export const getTypeDelays = async (nodeId: string): Promise<TypeDelays> =>
  typeDelaysSchema.parse(await api.get(`/staff/documents/nodes/${encodeURIComponent(nodeId)}/type-delays/`));

export const typeDelaysQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['demandes', nodeId, 'delais-par-type'], queryFn: () => getTypeDelays(nodeId), staleTime: 10 * 60 * 1000 });

/** Réservé à `horaires.gerer` ou `structure.gerer` : `enabled` évite un 403 attendu. */
export const useTypeDelays = (nodeId: string, enabled: boolean) => useQuery({ ...typeDelaysQueryOptions(nodeId), enabled });
