import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type PublicParish, publicParishSchema } from '../types/schemas';

/** Collecte d'une paroisse : fonds ouverts, montants suggérés, frais, mention d'autorisation (public). */
export const getPublicParish = async (nodeId: string): Promise<PublicParish> =>
  publicParishSchema.parse(await api.get(`/public/dons/paroisses/${encodeURIComponent(nodeId)}/`));

export const publicParishQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['dons', 'paroisse', nodeId], queryFn: () => getPublicParish(nodeId) });

export const usePublicParish = (nodeId: string | null | undefined) =>
  useQuery({ ...publicParishQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
