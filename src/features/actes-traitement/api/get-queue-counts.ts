import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const countsSchema = z.object({ counts: z.record(z.string(), z.number()), total: z.number() });
export type QueueCounts = z.infer<typeof countsSchema>;

export const getQueueCounts = async (nodeId: string): Promise<QueueCounts> =>
  countsSchema.parse(await api.get('/staff/documents/counts/', { params: { node: nodeId } }));

export const queueCountsQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['demandes', nodeId, 'compteurs'], queryFn: () => getQueueCounts(nodeId) });

export const useQueueCounts = (nodeId: string) => useQuery(queueCountsQueryOptions(nodeId));
