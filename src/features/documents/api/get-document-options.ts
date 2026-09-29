import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type DocumentOptions, documentOptionsSchema } from '../types';

/** `GET /v1/documents/requests/options/` : types, motifs permis, retraits. */
export const getDocumentOptions = (): Promise<DocumentOptions> =>
  api
    .get<unknown>('/v1/documents/requests/options/')
    .then((d) => documentOptionsSchema.parse(d));

export const useDocumentOptions = () =>
  useQuery(
    queryOptions({
      queryKey: ['documents', 'options'],
      queryFn: getDocumentOptions,
      staleTime: 60 * 60_000,
    }),
  );
