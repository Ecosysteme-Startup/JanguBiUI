'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { createSocket } from '@/lib/ws';
import { presenceDepuisTrame, useRealtimeStore } from '@/stores/realtime-store';

import { type NotificationFrame, publishNotificationFrame, registerNotificationsSocket } from './notifications-socket';

/** Battement de présence (backend TEMPS-REEL §2.2) : garde « en ligne » tant que l'onglet est ouvert. */
export const PRESENCE_PING_MS = 25_000;

/** Chemin de la socket unique de l'onglet. */
export const NOTIFICATIONS_SOCKET_PATH = '/ws/notifications/';

/**
 * Clé du cache des notifications : celle de `features/notifications/api/get-notifications.ts` et de
 * la cloche (`hooks/use-unread-notifications.ts`), partagée sans import de feature.
 */
const NOTIFICATIONS_KEY = ['notifications'];

/**
 * Socket `ws/notifications/` (backend `docs/TEMPS-REEL.md` §2, §4) : UNE par onglet, montée par le
 * shell (`RealtimeBridge`), gérée par `lib/ws.ts` (ticket frais à chaque connexion, reprise
 * plafonnée puis « hors ligne »).
 * - `notification` (hors `playback.state`, synchronisation de lecture) : la liste des
 *   notifications est invalidée ; la cloche et le centre se mettent à jour ;
 * - `presence.changed` : présence d'un interlocuteur, dans `useRealtimeStore` ;
 * - toute trame est publiée sur le bus (`subscribeNotifications`) : le lecteur y écoute
 *   `playback.state` ;
 * - battement `presence.ping` toutes les 25 s tant que l'onglet est ouvert (onglet masqué compris).
 * Après une reconnexion, la liste est invalidée pour rattraper ce qui a pu arriver pendant la coupure.
 */
export const useNotificationsSocket = (actif: boolean) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!actif) return undefined;
    const { setNotificationsSocket, setPresences } = useRealtimeStore.getState();
    let dejaOuverte = false;

    const traiter = (data: unknown) => {
      if (!data || typeof data !== 'object' || typeof (data as { type?: unknown }).type !== 'string') return;
      const trame = data as NotificationFrame;
      if (trame.type === 'notification') {
        if (trame.event_type !== 'playback.state') void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      } else if (trame.type === 'presence.changed') {
        const presence = presenceDepuisTrame(trame);
        if (presence) setPresences([presence]);
      }
      publishNotificationFrame(trame);
    };

    const socket = createSocket(NOTIFICATIONS_SOCKET_PATH, {
      onMessage: traiter,
      onStatus: (status) => {
        setNotificationsSocket(status);
        if (status !== 'open') return;
        if (dejaOuverte) void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        dejaOuverte = true;
      },
    });
    registerNotificationsSocket(socket);

    const battement = setInterval(() => socket.send({ type: 'presence.ping' }), PRESENCE_PING_MS);

    return () => {
      clearInterval(battement);
      registerNotificationsSocket(null);
      socket.close();
      setNotificationsSocket('inactive');
    };
  }, [actif, queryClient]);
};
