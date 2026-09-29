import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { albumSchema, type Album, type AlbumKind } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/albums/?source=&kind= — albums publiés et visibles.
export const getAlbums = async (params: {
  kind?: AlbumKind;
  source?: string;
}): Promise<Album[]> =>
  z
    .array(albumSchema)
    .parse(await api.get<unknown>(`${AUDIO}/albums/`, { params }));

export const getAlbumsQueryOptions = (params: {
  kind?: AlbumKind;
  source?: string;
}) =>
  queryOptions({
    queryKey: sonoKeys.albums(params),
    queryFn: () => getAlbums(params),
  });

export const useAlbums = (params: { kind?: AlbumKind; source?: string } = {}) =>
  useQuery(getAlbumsQueryOptions(params));
