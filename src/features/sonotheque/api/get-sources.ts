import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { sourceSchema, type Source, type SourceKind } from '../types/schemas';
import { compareFr } from '../utils/format';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/sources/ — ordre alphabétique (aucun classement entre sources).
// On retrie côté client par sécurité : l'ordre ne doit jamais dépendre d'un
// autre critère que le nom.
export const getSources = async (kind?: SourceKind): Promise<Source[]> => {
  const raw = await api.get<unknown>(`${AUDIO}/sources/`, {
    params: { kind },
  });
  return z
    .array(sourceSchema)
    .parse(raw)
    .sort((a, b) => compareFr(a.name, b.name));
};

export const getSourcesQueryOptions = (kind?: SourceKind) =>
  queryOptions({
    queryKey: sonoKeys.sources(kind),
    queryFn: () => getSources(kind),
  });

export const useSources = (kind?: SourceKind) =>
  useQuery(getSourcesQueryOptions(kind));
