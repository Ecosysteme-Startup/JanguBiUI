'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { useNotifications } from '@/components/ui/notifications';

import { getLecture } from './api/get-lecture';
import type { Track } from './types/schemas';

/**
 * Adaptateur de lecture de la sonothèque.
 *
 * Toutes les pages de la sonothèque lancent la lecture par `usePlayTracks()`
 * et n'en connaissent rien d'autre. Le lecteur global (lot C5-lecteur,
 * `hls.js`, file d'attente, plein écran) exposera
 * `usePlayer().playTracks(tracks, index)` : l'intégrateur n'aura qu'à
 * remplacer le corps de `usePlayTracks` par
 *
 *   const player = usePlayer();
 *   return {
 *     playTracks: player.playTracks,
 *     currentTrackId: player.current?.id ?? null,
 *     isPlaying: player.isPlaying,
 *   };
 *
 * et supprimer le repli ci-dessous.
 *
 * Repli (en attendant) : un seul `<audio>` partagé, alimenté par
 * `POST audio/pistes/<id>/lecture/` (MP3 128 kb/s de secours, lu nativement
 * partout ; le HLS demande hls.js, qui arrive avec le lecteur global). Reprise
 * à la position renvoyée par le serveur, piste suivante à la fin.
 */

export type PlayTracks = (tracks: Track[], index?: number) => void;

type Etat = { currentTrackId: string | null; isPlaying: boolean };

let etat: Etat = { currentTrackId: null, isPlaying: false };
const abonnes = new Set<() => void>();
let audio: HTMLAudioElement | null = null;
let file: Track[] = [];
let rang = 0;
let jeton = 0;

const publier = (partiel: Partial<Etat>) => {
  etat = { ...etat, ...partiel };
  abonnes.forEach((f) => f());
};

const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

function lecteurDeRepli(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined')
    return null;
  if (!audio) {
    audio = new Audio();
    audio.preload = 'auto';
    audio.addEventListener('play', () => publier({ isPlaying: true }));
    audio.addEventListener('pause', () => publier({ isPlaying: false }));
    audio.addEventListener('ended', () => {
      if (rang + 1 < file.length) void jouer(rang + 1);
      else publier({ isPlaying: false });
    });
  }
  return audio;
}

async function jouer(index: number) {
  const el = lecteurDeRepli();
  const piste = file[index];
  if (!el || !piste) return;
  rang = index;
  const moi = ++jeton;
  publier({ currentTrackId: piste.id });
  try {
    const lecture = await getLecture(piste.id);
    if (moi !== jeton) return; // une autre piste a été demandée entre-temps
    el.src = lecture.stream.mp3_url || lecture.stream.master_url;
    if (lecture.resume?.position_seconds) {
      el.currentTime = lecture.resume.position_seconds;
    }
    await el.play();
  } catch {
    if (moi !== jeton) return;
    publier({ isPlaying: false });
    useNotifications.getState().addNotification({
      type: 'error',
      title: 'Lecture impossible',
      message: `« ${piste.title} » ne peut pas être lu pour le moment.`,
    });
  }
}

/** Réinitialise le repli (tests). */
export function __resetLecteurDeRepli() {
  audio?.pause();
  audio = null;
  file = [];
  rang = 0;
  jeton = 0;
  etat = { currentTrackId: null, isPlaying: false };
}

export function usePlayTracks(): Etat & {
  playTracks: PlayTracks;
  togglePause: () => void;
} {
  const courant = useSyncExternalStore(
    abonner,
    () => etat,
    () => etat,
  );
  const playTracks = useCallback<PlayTracks>((tracks, index = 0) => {
    if (!tracks.length) return;
    file = tracks;
    void jouer(Math.max(0, Math.min(index, tracks.length - 1)));
  }, []);
  const togglePause = useCallback(() => {
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  }, []);
  return { ...courant, playTracks, togglePause };
}
