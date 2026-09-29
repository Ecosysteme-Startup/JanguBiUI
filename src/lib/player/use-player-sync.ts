'use client';

import { useEffect } from 'react';

import { subscribeNotifications } from '@/lib/realtime/notifications-socket';

import { fetchPlaybackState, fetchTrack } from './api';
import { getDeviceId } from './device';
import { flushListenEvents } from './listen-events';
import { usePlayerStore } from './player-store';
import { reportPlaybackState, STATE_INTERVAL_MS } from './state-sync';
import { playbackStateEventSchema } from './types';

export const EVENTS_INTERVAL_MS = 30_000;
/** Au-delà, un état de lecture n'est plus proposé à la reprise. */
const OFFER_MAX_AGE_MS = 48 * 3600 * 1000;

function reportNow(keepalive = false) {
  const { current, position, status } = usePlayerStore.getState();
  if (!current || status === 'idle' || status === 'error') return;
  void reportPlaybackState({ trackId: current.id, position, keepalive });
}

/**
 * Synchronisation du lecteur avec le serveur (contrat §3 et §6) :
 * - `PUT lecture/etat/` toutes les 15 s pendant la lecture et à `pagehide` ;
 * - événements d'écoute envoyés toutes les 30 s, au retour du réseau, quand
 *   l'onglet passe en arrière-plan et à `pagehide` ;
 * - au démarrage (`enabled` = personne connectée) : `GET lecture/etat/` pour
 *   proposer « Reprendre sur cet appareil » ;
 * - `playback.state` sur `ws/notifications/` : action `etat`, un autre
 *   appareil a écrit sa position (offre de reprise) ; action `pause`, un
 *   autre appareil vient de lancer la lecture, on se met en pause.
 */
export function usePlayerSync(enabled: boolean) {
  // Relevés périodiques et fermeture de l'onglet.
  useEffect(() => {
    const stateTimer = setInterval(() => {
      if (usePlayerStore.getState().status === 'playing') reportNow();
    }, STATE_INTERVAL_MS);
    const eventsTimer = setInterval(() => {
      void flushListenEvents();
    }, EVENTS_INTERVAL_MS);
    const onPageHide = () => {
      reportNow(true);
      void flushListenEvents({ keepalive: true });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void flushListenEvents();
    };
    const onOnline = () => void flushListenEvents();
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(stateTimer);
      clearInterval(eventsTimer);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Reprise au démarrage.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchPlaybackState()
      .then((state) => {
        if (cancelled || !state) return;
        const s = usePlayerStore.getState();
        if (s.current) return;
        const age = Date.now() - new Date(state.updated_at).getTime();
        if (!(age < OFFER_MAX_AGE_MS)) return;
        if (state.position_seconds < 1) return;
        s.setOffer({
          track: state.track,
          positionSeconds: state.position_seconds,
          deviceId: state.device_id,
          updatedAt: state.updated_at,
        });
      })
      .catch(() => {
        // pas d'état ou réseau indisponible : rien à proposer
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Un autre appareil vient d'écrire son état.
  useEffect(() => {
    if (!enabled) return;
    return subscribeNotifications((frame) => {
      const parsed = playbackStateEventSchema.safeParse(frame);
      if (!parsed.success) return;
      const ev = parsed.data;
      // Une lecture à la fois (décision 10) : un autre appareil vient de
      // lancer la lecture ; on se met en pause, sans message d'erreur.
      if (ev.action === 'pause') {
        if (ev.sauf_device_id !== getDeviceId()) {
          usePlayerStore.getState().pauseForOtherDevice();
        }
        return;
      }
      if (ev.device_id === getDeviceId()) return;
      const s = usePlayerStore.getState();
      // On écoute déjà ici : on ne dérange pas.
      if (s.status === 'playing' || s.status === 'loading') return;
      const known =
        s.current?.id === ev.track_id
          ? s.current
          : s.offer?.track.id === ev.track_id
            ? s.offer.track
            : null;
      const withTrack = known
        ? Promise.resolve(known)
        : fetchTrack(ev.track_id);
      withTrack
        .then((track) => {
          usePlayerStore.getState().setOffer({
            track,
            positionSeconds: ev.position_seconds,
            deviceId: ev.device_id,
            updatedAt: ev.updated_at,
          });
        })
        .catch(() => {
          // piste plus visible : rien à proposer
        });
    });
  }, [enabled]);
}
