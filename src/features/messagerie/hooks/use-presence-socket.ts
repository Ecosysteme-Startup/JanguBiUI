'use client';

import { useEffect, useRef } from 'react';

import { useSocket } from '@/hooks/use-socket';
import { presenceDepuisTrame, useRealtimeStore } from '@/stores/realtime-store';

/** Battement de présence (backend TEMPS-REEL §2.2) : garde « en ligne » tant que l'écran est ouvert. */
export const PRESENCE_PING_MS = 25_000;

/**
 * Présence dans la messagerie (décisions V2, TEMPS-REEL §2) : pendant qu'un écran de messagerie
 * est ouvert, la socket `ws/notifications/` apporte les `presence.changed` des interlocuteurs et
 * porte le battement `presence.ping` de la personne.
 */
export const usePresenceSocket = (enabled: boolean) => {
  const setPresences = useRealtimeStore((s) => s.setPresences);
  const socket = useSocket(enabled ? '/ws/notifications/' : null, (data) => {
    if (!data || typeof data !== 'object') return;
    const trame = data as Record<string, unknown>;
    if (trame.type !== 'presence.changed') return;
    const presence = presenceDepuisTrame(trame);
    if (presence) setPresences([presence]);
  });
  const send = useRef(socket.send);
  send.current = socket.send;

  useEffect(() => {
    if (!enabled) return undefined;
    const battement = setInterval(
      () => send.current({ type: 'presence.ping' }),
      PRESENCE_PING_MS,
    );
    return () => clearInterval(battement);
  }, [enabled]);
};
