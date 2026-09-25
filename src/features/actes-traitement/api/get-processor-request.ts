import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type ProcessorRequest, processorRequestSchema } from '../types/processing';

export const getProcessorRequest = async (id: string): Promise<ProcessorRequest> =>
  processorRequestSchema.parse(await api.get(`/staff/documents/${encodeURIComponent(id)}/`));

export const processorRequestQueryOptions = (nodeId: string, id: string) =>
  queryOptions({ queryKey: ['demandes', nodeId, 'detail', id], queryFn: () => getProcessorRequest(id) });

export const useProcessorRequest = (nodeId: string, id: string) => useQuery(processorRequestQueryOptions(nodeId, id));
