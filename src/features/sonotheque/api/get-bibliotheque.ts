import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { api } from '@/lib/api-client';
import { onTrackLikeChanged } from '@/lib/player/like-events';

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

export const useBibliotheque = () => {
  const qc = useQueryClient();
  // Un « j'aime » depuis le lecteur global rafraîchit la bibliothèque (JB-WEB-032), sans que le
  // lecteur (couche partagée) ne dépende de cette feature.
  useEffect(() => onTrackLikeChanged(() => void qc.invalidateQueries({ queryKey: sonoKeys.bibliotheque })), [qc]);
  return useQuery(getBibliothequeQueryOptions());
};

/** Ensemble des pistes aimées (pour l'état du cœur sur chaque ligne). */
export const useLikedIds = (): Set<string> => {
  const { data } = useBibliotheque();
  return new Set((data?.likes ?? []).map((t) => t.id));
};
