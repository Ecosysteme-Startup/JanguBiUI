import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const choiceSchema = z.object({ value: z.string(), label: z.string() });

const optionsSchema = z.object({
  document_types: z.array(
    choiceSchema.extend({ requires_precision: z.boolean(), allowed_reasons: z.array(z.string()) }),
  ),
  reasons: z.array(choiceSchema),
  pickup_modes: z.array(choiceSchema),
});
export type RequestOptions = z.infer<typeof optionsSchema>;
export type DocumentTypeOption = RequestOptions['document_types'][number];

/** Types, motifs et compatibilités : source unique côté backend (constants.py), jamais recopiée ici. */
export const getRequestOptions = async (): Promise<RequestOptions> =>
  optionsSchema.parse(await api.get('/documents/requests/options/'));

export const requestOptionsQueryOptions = () =>
  queryOptions({ queryKey: ['demandes', 'options'], queryFn: getRequestOptions, staleTime: 60 * 60 * 1000 });

export const useRequestOptions = () => useQuery(requestOptionsQueryOptions());
