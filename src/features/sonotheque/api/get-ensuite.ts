import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { trackSchema, type Track } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/pistes/<id>/ensuite/ — 10 voisins, filtrés par droits.
export const getEnsuite = async (trackId: string): Promise<Track[]> =>
  z
    .array(trackSchema)
    .parse(await api.get<unknown>(`${AUDIO}/pistes/${trackId}/ensuite/`));

export const getEnsuiteQueryOptions = (trackId: string) =>
  queryOptions({
    queryKey: sonoKeys.ensuite(trackId),
    queryFn: () => getEnsuite(trackId),
    enabled: !!trackId,
  });

export const useEnsuite = (trackId: string) =>
  useQuery(getEnsuiteQueryOptions(trackId));
