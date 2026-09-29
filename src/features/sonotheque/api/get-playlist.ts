import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { playlistDetailSchema, type PlaylistDetail } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/playlists/<id>/ — pistes filtrées par droits ; 404 pour la
// playlist privée d'un autre.
export const getPlaylist = async (id: string): Promise<PlaylistDetail> =>
  playlistDetailSchema.parse(
    await api.get<unknown>(`${AUDIO}/playlists/${id}/`),
  );

export const getPlaylistQueryOptions = (id: string) =>
  queryOptions({
    queryKey: sonoKeys.playlist(id),
    queryFn: () => getPlaylist(id),
    enabled: !!id,
  });

export const usePlaylist = (id: string) =>
  useQuery(getPlaylistQueryOptions(id));
