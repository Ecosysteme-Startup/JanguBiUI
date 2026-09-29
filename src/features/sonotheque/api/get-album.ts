import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { albumDetailSchema, type AlbumDetail } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/albums/<id>/ — 404 si l'album n'est pas visible (réservé aux
// paroissiens d'une autre paroisse, ou brouillon) : on ne dit pas qu'il existe.
export const getAlbum = async (id: string): Promise<AlbumDetail> =>
  albumDetailSchema.parse(await api.get<unknown>(`${AUDIO}/albums/${id}/`));

export const getAlbumQueryOptions = (id: string) =>
  queryOptions({
    queryKey: sonoKeys.album(id),
    queryFn: () => getAlbum(id),
    enabled: !!id,
  });

export const useAlbum = (id: string) => useQuery(getAlbumQueryOptions(id));
