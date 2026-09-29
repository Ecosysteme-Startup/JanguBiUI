import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { bibliothequeSchema, type Bibliotheque } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/bibliotheque/ — titres aimés, mes playlists, écoutés récemment.
export const getBibliotheque = async (): Promise<Bibliotheque> =>
  bibliothequeSchema.parse(await api.get<unknown>(`${AUDIO}/bibliotheque/`));

export const getBibliothequeQueryOptions = () =>
  queryOptions({
    queryKey: sonoKeys.bibliotheque,
    queryFn: getBibliotheque,
  });

export const useBibliotheque = () => useQuery(getBibliothequeQueryOptions());

/** Ensemble des pistes aimées (pour l'état du cœur sur chaque ligne). */
export const useLikedIds = (): Set<string> => {
  const { data } = useBibliotheque();
  return new Set((data?.likes ?? []).map((t) => t.id));
};
