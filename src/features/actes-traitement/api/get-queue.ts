import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type QueuePage, queuePageSchema } from '../types/processing';

export const QUEUE_PAGE_SIZE = 12;

export type QueueFilters = { statut: string; type: string; q: string; retard: boolean; page: number };

/** File de traitement du nœud (actes.traiter), filtrée côté serveur. */
export const getQueue = async (nodeId: string, f: QueueFilters): Promise<QueuePage> =>
  queuePageSchema.parse(
    await api.get('/staff/documents/', {
      params: {
        node: nodeId,
        status: f.statut || undefined,
        document_type: f.type || undefined,
        search: f.q.trim() || undefined,
        overdue: f.retard || undefined,
        limit: QUEUE_PAGE_SIZE,
        offset: (f.page - 1) * QUEUE_PAGE_SIZE,
      },
    }),
  );

export const queueQueryOptions = (nodeId: string, filters: QueueFilters) =>
  queryOptions({
    queryKey: ['demandes', nodeId, 'file', filters],
    queryFn: () => getQueue(nodeId, filters),
    placeholderData: keepPreviousData,
  });

export const useQueue = (nodeId: string, filters: QueueFilters) => useQuery(queueQueryOptions(nodeId, filters));
