'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { z } from 'zod';

import { useSocket } from '@/hooks/use-socket';

import { mergeMessage, messagesQueryKey } from '../api/get-messages';
import { messageSchema, type Message } from '../api/schemas';

/**
 * Trames du `ConversationConsumer` (apps/messaging/consumers.py). Écart backend : pour la
 * lecture et la saisie, le `type` de l'évènement Channels écrase celui de la trame, qui
 * arrive donc en `conv_read` / `conv_typing` au lieu de `message.read` / `typing` : on
 * accepte les deux.
 */
const frameSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('message.received'), message: messageSchema }),
  z.object({ type: z.literal('message.read') }),
  z.object({ type: z.literal('conv_read') }),
  z.object({
    type: z.literal('typing'),
    user_id: z.string(),
    is_typing: z.boolean(),
  }),
  z.object({
    type: z.literal('conv_typing'),
    user_id: z.string(),
    is_typing: z.boolean(),
  }),
  z.object({ type: z.literal('error'), detail: z.string().optional() }),
]);

export const conversationSocketPath = (conversationId: string) =>
  `/ws/messaging/conversations/${encodeURIComponent(conversationId)}/`;

/** Temps réel d'une conversation : nouveaux messages, accusés de lecture, saisie en cours. */
export const useConversationSocket = (
  conversationId: string,
  { enabled, meId }: { enabled: boolean; meId?: string },
) => {
  const queryClient = useQueryClient();
  const [peerTyping, setPeerTyping] = useState(false);
  const onMessage = useCallback(
    (data: unknown) => {
      const parsed = frameSchema.safeParse(data);
      if (!parsed.success) return;
      const frame = parsed.data;
      const key = messagesQueryKey(conversationId);
      switch (frame.type) {
        case 'message.received':
          queryClient.setQueryData<Message[]>(key, (list) =>
            mergeMessage(list, frame.message),
          );
          if (frame.message.sender_id !== meId) setPeerTyping(false);
          break;
        case 'message.read':
        case 'conv_read':
          void queryClient.invalidateQueries({ queryKey: key });
          break;
        case 'typing':
        case 'conv_typing':
          if (frame.user_id !== meId) setPeerTyping(frame.is_typing);
          break;
        default:
          break;
      }
    },
    [queryClient, conversationId, meId],
  );

  const socket = useSocket(
    enabled ? conversationSocketPath(conversationId) : null,
    onMessage,
  );
  return { ...socket, peerTyping };
};
