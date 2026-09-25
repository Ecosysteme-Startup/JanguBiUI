import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { requestPageSchema } from '../types/request';

/** Plafond de l'API (LimitOffsetPagination, max 50) : un fidèle en a rarement davantage. */
export const REQUESTS_PAGE_SIZE = 50;

export const getRequests = async (offset: number) =>
  requestPageSchema.parse(await api.get('/documents/requests/', { params: { limit: REQUESTS_PAGE_SIZE, offset } }));

export const requestsQueryOptions = (offset = 0) =>
  queryOptions({ queryKey: ['demandes', 'mine', { offset }], queryFn: () => getRequests(offset) });

export const useRequests = (offset = 0) => useQuery(requestsQueryOptions(offset));
