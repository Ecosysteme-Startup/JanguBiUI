import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { paginatedSchema } from '@/lib/pagination';

import { type RequesterStatus, requesterRequestSchema } from '../types';

const pageSchema = paginatedSchema(requesterRequestSchema);
export type DocumentsResponse = ReturnType<typeof pageSchema.parse>;

export type DocumentsParams = {
  status?: RequesterStatus;
  limit?: number;
  offset?: number;
};

/** `GET /v1/documents/requests/` : mes demandes, les plus récentes d'abord. */
export const getDocumentRequests = (
  params: DocumentsParams = {},
): Promise<DocumentsResponse> =>
  api
    .get<unknown>('/v1/documents/requests/', {
      params: { limit: 50, ...params },
    })
    .then((d) => pageSchema.parse(d));

export const getDocumentRequestsQueryOptions = (params?: DocumentsParams) =>
  queryOptions({
    queryKey: ['documents', 'requests', params ?? {}],
    queryFn: () => getDocumentRequests(params),
  });

export const useDocumentRequests = (params?: DocumentsParams) =>
  useQuery(getDocumentRequestsQueryOptions(params));
