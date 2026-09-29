import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const parishSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.object({ code: z.string(), label: z.string().optional() }).passthrough(),
  address: z.string().nullish(),
  city: z.string().nullish(),
});
export type Parish = z.infer<typeof parishSchema>;

/** Fiche du nœud suivi (lecture publique) : nom, adresse, ville. */
export const getParish = async (nodeId: string): Promise<Parish> =>
  parishSchema.parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/`));

export const parishQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['paroisse', nodeId, 'fiche'], queryFn: () => getParish(nodeId), staleTime: 30 * 60 * 1000 });

export const useParish = (nodeId: string) => useQuery(parishQueryOptions(nodeId));
