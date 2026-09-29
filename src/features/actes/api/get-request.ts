import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type DocumentRequest, requestSchema } from '../types/request';

export const getRequest = async (id: string): Promise<DocumentRequest> =>
  requestSchema.parse(await api.get(`/documents/requests/${encodeURIComponent(id)}/`));

export const requestQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['demandes', 'mine', 'detail', id], queryFn: () => getRequest(id) });

export const useRequest = (id: string) => useQuery(requestQueryOptions(id));
