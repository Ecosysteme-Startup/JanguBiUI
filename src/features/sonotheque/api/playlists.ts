import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { playlistSchema, type Playlist } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// Playlists personnelles : `prive` (propriétaire seul) ou `public` ; jamais
// `paroisse` (400 visibilite_invalide).
export type CreatePlaylistInput = {
  title: string;
  visibility: 'prive' | 'public';
};

export const createPlaylist = async (
  input: CreatePlaylistInput,
): Promise<Playlist> =>
  playlistSchema.parse(await api.post<unknown>(`${AUDIO}/playlists/`, input));

export const useCreatePlaylist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlaylist,
    onSuccess: () => qc.invalidateQueries({ queryKey: sonoKeys.bibliotheque }),
  });
};

export const addTrackToPlaylist = async ({
  playlistId,
  trackId,
}: {
  playlistId: string;
  trackId: string;
}): Promise<Playlist> =>
  playlistSchema.parse(
    await api.post<unknown>(`${AUDIO}/playlists/${playlistId}/pistes/`, {
      track_id: trackId,
    }),
  );

export const useAddTrackToPlaylist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addTrackToPlaylist,
    onSuccess: (_p, { playlistId }) => {
      void qc.invalidateQueries({ queryKey: sonoKeys.playlist(playlistId) });
      void qc.invalidateQueries({ queryKey: sonoKeys.bibliotheque });
    },
  });
};

export const removeTrackFromPlaylist = ({
  playlistId,
  trackId,
}: {
  playlistId: string;
  trackId: string;
}) => api.delete<null>(`${AUDIO}/playlists/${playlistId}/pistes/${trackId}/`);

export const useRemoveTrackFromPlaylist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeTrackFromPlaylist,
    onSuccess: (_r, { playlistId }) => {
      void qc.invalidateQueries({ queryKey: sonoKeys.playlist(playlistId) });
      void qc.invalidateQueries({ queryKey: sonoKeys.bibliotheque });
    },
  });
};
