'use client';

import { useEffect } from 'react';

import { coverOf, usePlayerStore } from './player-store';
import { SKIP_SECONDS } from './use-player-shortcuts';

/**
 * Commandes du système (touches multimédia, écran verrouillé, casque) via la
 * Media Session API, quand le navigateur la propose.
 */
export function useMediaSession() {
  const current = usePlayerStore((s) => s.current);
  const status = usePlayerStore((s) => s.status);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator))
      return;
    const ms = navigator.mediaSession;
    const store = usePlayerStore.getState;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => store().play()],
      ['pause', () => store().pause()],
      ['previoustrack', () => store().previous()],
      ['nexttrack', () => store().next()],
      ['seekbackward', (d) => store().skipBy(-(d.seekOffset ?? SKIP_SECONDS))],
      ['seekforward', (d) => store().skipBy(d.seekOffset ?? SKIP_SECONDS)],
      ['seekto', (d) => d.seekTime != null && store().seek(d.seekTime)],
    ];
    for (const [action, handler] of handlers) {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // action non prise en charge
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          ms.setActionHandler(action, null);
        } catch {
          // ignoré
        }
      }
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator))
      return;
    if (typeof MediaMetadata === 'undefined') return;
    if (!current) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const cover = coverOf(current);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.source?.name ?? current.performers.join(', '),
      album: current.album?.title ?? '',
      artwork: cover
        ? [{ src: cover, sizes: '800x800', type: 'image/jpeg' }]
        : [],
    });
  }, [current]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator))
      return;
    navigator.mediaSession.playbackState =
      status === 'playing'
        ? 'playing'
        : status === 'paused'
          ? 'paused'
          : 'none';
  }, [status]);
}
