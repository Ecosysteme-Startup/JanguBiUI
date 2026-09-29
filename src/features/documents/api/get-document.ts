import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type RequesterRequest, requesterRequestSchema } from '../types';

/** `GET /v1/documents/requests/<uuid>/` (avec l'historique). */
export const getDocumentRequest = (id: string): Promise<RequesterRequest> =>
  api
    .get<unknown>(`/v1/documents/requests/${id}/`)
    .then((data) => requesterRequestSchema.parse(data));

export const getDocumentRequestQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['documents', 'requests', 'detail', id],
    queryFn: () => getDocumentRequest(id),
    enabled: !!id,
  });

export const useDocumentRequest = (id: string) =>
  useQuery(getDocumentRequestQueryOptions(id));
