'use client';

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { usePlayerStore } from '@/lib/player/player-store';
import { usePlayer } from '@/lib/player/use-player';

import type { Track } from './types/schemas';

/**
 * Adaptateur de lecture de la sonothèque : les pages lancent la lecture par
 * `usePlayTracks()` et passent par le lecteur global (`src/lib/player`,
 * voir `docs/LECTEUR-AUDIO.md`), qui appelle lui-même `lecture/`.
 */

export type PlayTracks = (tracks: Track[], index?: number) => void;

export function usePlayTracks(): {
  currentTrackId: string | null;
  isPlaying: boolean;
  playTracks: PlayTracks;
  togglePause: () => void;
} {
  const { playTracks: jouer, toggle } = usePlayer();
  const { currentTrackId, isPlaying } = usePlayerStore(
    useShallow((s) => ({
      currentTrackId: s.current?.id ?? null,
      isPlaying: s.status === 'playing' || s.status === 'loading',
    })),
  );
  const playTracks = useCallback<PlayTracks>(
    (tracks, index = 0) => {
      if (!tracks.length) return;
      // Le catalogue peut ne pas connaître encore la durée (piste en encodage).
      const pistes = tracks.map((t) => ({
        ...t,
        duration_seconds: t.duration_seconds ?? undefined,
      }));
      jouer(pistes, Math.max(0, Math.min(index, tracks.length - 1)));
    },
    [jouer],
  );
  return { currentTrackId, isPlaying, playTracks, togglePause: toggle };
}
