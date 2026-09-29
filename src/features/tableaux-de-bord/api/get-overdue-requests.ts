import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/**
 * Demandes en retard de la paroisse (GET /staff/documents/?overdue=true), pour l'encart du
 * tableau de bord. Doublon assumé de la file (feature actes-traitement) : on n'en lit que
 * les champs affichés ; réservé à `actes.traiter` (le tableau de bord d'une paroisse seulement).
 */
const itemSchema = z.object({
  id: z.string(),
  reference: z.string(),
  document_type_label: z.string(),
  status: z.string(),
  requester_name: z.string(),
  age_days: z.number().nullable(),
  created_at: z.string(),
});
export type OverdueRequest = z.infer<typeof itemSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(itemSchema) });
export type OverduePage = z.infer<typeof pageSchema>;

export const OVERDUE_LIMIT = 5;

export const getOverdueRequests = async (nodeId: string): Promise<OverduePage> =>
  pageSchema.parse(await api.get('/staff/documents/', { params: { node: nodeId, overdue: true, limit: OVERDUE_LIMIT, offset: 0 } }));

export const overdueRequestsQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['dashboards', 'nodes', nodeId, 'demandes-en-retard'], queryFn: () => getOverdueRequests(nodeId) });

export const useOverdueRequests = (nodeId: string, enabled: boolean) => useQuery({ ...overdueRequestsQueryOptions(nodeId), enabled });
