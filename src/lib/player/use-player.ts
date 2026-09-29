'use client';

import { useShallow } from 'zustand/react/shallow';

import {
  prefetchLecture,
  type PlayerState,
  usePlayerStore,
} from './player-store';

/**
 * API publique du lecteur global pour le reste de l'application
 * (sonothèque, accueil, recherche…). Voir docs/LECTEUR-AUDIO.md.
 *
 * ```tsx
 * const player = usePlayer();
 * player.playTracks(album.tracks, 2, {
 *   kindLabel: 'l’album',
 *   label: album.title,
 *   href: `/app/sonotheque/albums/${album.id}`,
 * });
 * const { isCurrent, isPlaying } = usePlayerTrackStatus(track.id);
 * ```
 */
export function usePlayer() {
  return usePlayerStore(
    useShallow((s: PlayerState) => ({
      playTracks: s.playTracks,
      playTrack: s.playTrack,
      toggle: s.toggle,
      play: s.play,
      pause: s.pause,
      seek: s.seek,
      next: s.next,
      previous: s.previous,
      addToQueue: s.addToQueue,
      playNext: s.playNext,
      expand: s.expand,
      collapse: s.collapse,
      toggleLike: s.toggleLike,
      prefetch: prefetchLecture,
    })),
  );
}

/** État d'une piste dans une liste : en cours ? en lecture ? (égaliseur). */
export function usePlayerTrackStatus(trackId: string) {
  return usePlayerStore(
    useShallow((s: PlayerState) => {
      const isCurrent = s.current?.id === trackId;
      return {
        isCurrent,
        isPlaying:
          isCurrent && (s.status === 'playing' || s.status === 'loading'),
      };
    }),
  );
}
