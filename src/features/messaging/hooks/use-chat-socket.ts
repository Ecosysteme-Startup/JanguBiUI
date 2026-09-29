'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import {
  clearAccessToken,
  clearRefreshToken,
  tryRefreshAccess,
} from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import {
  getWsTicket,
  PRESENCE_PING_MS,
  WS_CODE_INTERDIT,
  WS_CODES_AUTH,
  wsUrl,
} from '@/lib/realtime/ws';
import { presenceDepuisTrame, useRealtimeStore } from '@/stores/realtime-store';

import { Message, MessagesResponse, messageSchema } from '../types';

const RECONNECT_DELAYS = [1000, 3000, 10000];

/**
 * État de la connexion temps réel, exposé à l'UI pour afficher une bannière.
 * - `connecting`  : première tentative d'ouverture du socket
 * - `online`      : socket ouvert, messages en direct
 * - `reconnecting`: le socket a été coupé, nouvelle tentative en cours
 * - `offline`     : aucune connexion (token absent / session expirée)
 */
export type ChatSocketStatus =
  | 'connecting'
  | 'online'
  | 'reconnecting'
  | 'offline';

export function useChatSocket(conversationId: string) {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const currentUserId = user?.id;
  const userIdRef = useRef<string | undefined>(currentUserId);
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  const [status, setStatus] = useState<ChatSocketStatus>('connecting');

  // Keep latest userId available inside the WS handlers without resubscribing
  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!conversationId) return;

    unmountedRef.current = false;
    attemptRef.current = 0;
    setStatus('connecting');
    let battement: ReturnType<typeof setInterval> | null = null;

    const planifier = () => {
      const delay = RECONNECT_DELAYS[attemptRef.current] ?? 10000;
      attemptRef.current = Math.min(
        attemptRef.current + 1,
        RECONNECT_DELAYS.length - 1,
      );
      timerRef.current = setTimeout(() => void connect(), delay);
    };

    async function connect() {
      if (unmountedRef.current) return;

      // Ticket à usage unique (TEMPS-REEL §1) : un nouveau à chaque ouverture.
      // Le jeton d'accès ne passe jamais dans l'URL.
      let ticket: string;
      try {
        ticket = await getWsTicket();
      } catch {
        // Le composant a pu être démonté pendant l'await.
        if (unmountedRef.current) return;
        // Réseau coupé, ou session morte (le client API redirige alors).
        setStatus('reconnecting');
        planifier();
        return;
      }
      if (unmountedRef.current) return;

      const ws = new WebSocket(
        wsUrl(`messaging/conversations/${conversationId}`, ticket),
      );
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as {
            type: string;
            message: unknown;
          } & Record<string, unknown>;
          if (payload.type === 'presence.changed') {
            const presence = presenceDepuisTrame(payload);
            if (presence) useRealtimeStore.getState().setPresences([presence]);
            return;
          }
          if (payload.type === 'message.received') {
            const parsed = messageSchema.parse(payload.message);
            const uid = userIdRef.current;
            const msg: Message = {
              ...parsed,
              is_mine: uid ? parsed.sender_id === uid : parsed.is_mine,
            };
            queryClient.setQueryData<MessagesResponse>(
              ['messages', conversationId],
              (old) => {
                if (!old) return { count: 1, results: [msg] };
                const exists = old.results.some((m) => m.id === msg.id);
                if (exists) return old;
                return {
                  count: old.count + 1,
                  results: [...old.results, msg],
                };
              },
            );
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
        } catch (err) {
          console.warn('[chat-ws] malformed frame', err);
        }
      };

      ws.onopen = () => {
        attemptRef.current = 0;
        setStatus('online');
        // Battement de présence sur la conversation seulement si la socket de
        // notifications n'est pas ouverte (TEMPS-REEL §2.2).
        battement = setInterval(() => {
          const notificationsOuverte =
            useRealtimeStore.getState().notificationsSocket === 'ouverte';
          if (!notificationsOuverte && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'presence.ping' }));
          }
        }, PRESENCE_PING_MS);
      };

      ws.onclose = async (event) => {
        if (battement) clearInterval(battement);
        battement = null;
        if (unmountedRef.current) return;

        if (event.code === WS_CODE_INTERDIT) {
          // Pas participant de la conversation : inutile de réessayer.
          setStatus('offline');
          return;
        }

        const isAuthClose = WS_CODES_AUTH.has(event.code);

        // Sur fermeture auth, on tente un refresh silencieux : statut neutre
        // (`connecting`) plutôt qu'un flash « Reconnexion… » trompeur. Le statut
        // `reconnecting` est réservé aux coupures réseau (close codes non-auth).
        setStatus(isAuthClose ? 'connecting' : 'reconnecting');

        if (isAuthClose) {
          // Auth rejection from server — try refreshing before reconnecting
          try {
            await tryRefreshAccess();
          } catch {
            // Le composant a pu être démonté pendant l'await.
            if (unmountedRef.current) return;
            // Refresh failed — session dead, redirect to login
            setStatus('offline');
            clearAccessToken();
            clearRefreshToken();
            const redirectTo = encodeURIComponent(window.location.pathname);
            window.location.href = `/auth/login?redirectTo=${redirectTo}`;
            return;
          }
          // Le composant a pu être démonté pendant le refresh réussi.
          if (unmountedRef.current) return;
        }

        planifier();
      };

      ws.onerror = (event) => {
        console.warn('[chat-ws] error', event);
        ws.close();
      };
    }

    void connect();

    return () => {
      unmountedRef.current = true;
      if (battement) clearInterval(battement);
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [conversationId, queryClient]);

  return { wsRef, status };
}
