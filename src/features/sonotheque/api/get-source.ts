import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { sourceDetailSchema, type SourceDetail } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/sources/<id>/ — `most_played` : les plus écoutés de CETTE source
// seulement (jamais comparés à d'autres sources).
export const getSource = async (id: string): Promise<SourceDetail> =>
  sourceDetailSchema.parse(await api.get<unknown>(`${AUDIO}/sources/${id}/`));

export const getSourceQueryOptions = (id: string) =>
  queryOptions({
    queryKey: sonoKeys.source(id),
    queryFn: () => getSource(id),
    enabled: !!id,
  });

export const useSource = (id: string) => useQuery(getSourceQueryOptions(id));
