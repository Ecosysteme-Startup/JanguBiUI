'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { tryRefreshAccess } from '@/lib/api-client';
import { presenceDepuisTrame, useRealtimeStore } from '@/stores/realtime-store';

import { getWsTicket, PRESENCE_PING_MS, WS_CODES_AUTH, wsUrl } from './ws';

// Socket `ws/notifications/` (backend `docs/TEMPS-REEL.md` §2, §4) : une seule
// par onglet, montée par le shell de l'application.
// - `notification` : on recharge la liste des notifications (le polling de
//   30 s ne sert plus qu'en secours, socket fermée) ;
// - `presence.changed` : présence d'un interlocuteur ;
// - battement `presence.ping` toutes les 25 s, qui garde « en ligne ». Onglet
//   masqué : le battement continue (l'onglet reste en ligne, §2.2).

const DELAIS_RECONNEXION = [1000, 3000, 10_000, 30_000];

export type TrameTempsReel = { type: string } & Record<string, unknown>;

export function useNotificationsSocket(actif: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!actif) return;
    const { setNotificationsSocket, setPresences } =
      useRealtimeStore.getState();

    let arrete = false;
    let ws: WebSocket | null = null;
    let battement: ReturnType<typeof setInterval> | null = null;
    let reprise: ReturnType<typeof setTimeout> | null = null;
    let tentative = 0;

    const planifier = () => {
      if (arrete) return;
      const delai =
        DELAIS_RECONNEXION[Math.min(tentative, DELAIS_RECONNEXION.length - 1)];
      tentative += 1;
      reprise = setTimeout(() => void ouvrir(), delai);
    };

    const traiter = (trame: TrameTempsReel) => {
      if (trame.type === 'notification') {
        // `playback.state` (synchronisation de lecture) n'est pas une
        // notification affichée.
        if (trame.event_type !== 'playback.state') {
          void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      } else if (trame.type === 'presence.changed') {
        const presence = presenceDepuisTrame(trame);
        if (presence) setPresences([presence]);
      }
    };

    async function ouvrir() {
      if (arrete) return;
      setNotificationsSocket(tentative === 0 ? 'connexion' : 'reconnexion');
      let ticket: string;
      try {
        ticket = await getWsTicket();
      } catch {
        // Hors ligne, ou session expirée (le client API gère la redirection).
        planifier();
        return;
      }
      if (arrete) return;

      const socket = new WebSocket(wsUrl('notifications', ticket));
      ws = socket;

      socket.onopen = () => {
        tentative = 0;
        setNotificationsSocket('ouverte');
        // Rattrape ce qui a pu arriver pendant la coupure.
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        battement = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'presence.ping' }));
          }
        }, PRESENCE_PING_MS);
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const trame = JSON.parse(String(event.data)) as TrameTempsReel;
          if (trame && typeof trame.type === 'string') traiter(trame);
        } catch {
          // trame illisible : ignorée
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = async (event: CloseEvent) => {
        if (battement) clearInterval(battement);
        battement = null;
        if (ws === socket) ws = null;
        if (arrete) return;
        setNotificationsSocket('reconnexion');
        if (WS_CODES_AUTH.has(event.code)) {
          try {
            await tryRefreshAccess();
          } catch {
            setNotificationsSocket('inactive');
            return;
          }
        }
        planifier();
      };
    }

    void ouvrir();

    return () => {
      arrete = true;
      if (battement) clearInterval(battement);
      if (reprise) clearTimeout(reprise);
      ws?.close(1000);
      ws = null;
      setNotificationsSocket('inactive');
    };
  }, [actif, queryClient]);
}
