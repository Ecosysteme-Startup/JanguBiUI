import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Message, MessagesResponse, messageSchema } from '../types';

export type SendMessageInput = {
  content: string;
  /** UUID d'idempotence : un renvoi ne crée pas de doublon côté serveur. */
  client_message_id?: string;
  reply_to_id?: string | null;
};

export const sendMessage = (
  conversationId: string,
  data: SendMessageInput,
): Promise<Message> =>
  api
    .post<unknown>(
      `/v1/messaging/conversations/${conversationId}/messages/send/`,
      data,
    )
    .then((res) => messageSchema.parse(res));

const newUuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () =>
        Math.floor(Math.random() * 16).toString(16),
      );

/** Ajoute un `client_message_id` (UUID) s'il manque. */
export const withClientId = (data: SendMessageInput): SendMessageInput =>
  data.client_message_id ? data : { ...data, client_message_id: newUuid() };

/** Préfixe des ID temporaires d'envoi optimiste (avant confirmation serveur). */
export const OPTIMISTIC_ID_PREFIX = 'optimistic-';

type OptimisticContext = { tempId: string; previous?: MessagesResponse };

function buildOptimisticMessage(content: string, tempId: string): Message {
  return {
    id: tempId,
    client_message_id: tempId,
    content,
    content_type: 'text',
    sender_id: '',
    sender_name: null,
    reply_to_id: null,
    read_at: null,
    deleted_at: null,
    is_deleted: false,
    reactions: [],
    attachments: [],
    created_at: new Date().toISOString(),
    is_mine: true,
  };
}

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['messages', conversationId];

  return useMutation({
    mutationFn: (data: SendMessageInput) => sendMessage(conversationId, data),
    onMutate: async (data): Promise<OptimisticContext> => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MessagesResponse>(queryKey);
      const tempId = `${OPTIMISTIC_ID_PREFIX}${data.client_message_id ?? newUuid()}`;
      const optimistic = buildOptimisticMessage(data.content, tempId);

      queryClient.setQueryData<MessagesResponse>(queryKey, (old) => {
        if (!old) return { count: 1, results: [optimistic] };
        return { count: old.count + 1, results: [...old.results, optimistic] };
      });

      return { tempId, previous };
    },
    onError: (_err, _data, context) => {
      // Rollback. Si le cache existait avant l'envoi → on le restaure tel quel.
      // S'il était vide (`previous === undefined`), restaurer ne suffit pas :
      // le message optimiste injecté resterait orphelin. On le retire alors par
      // son `tempId` pour ne pas laisser de message fantôme.
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
        return;
      }
      if (context?.tempId) {
        queryClient.setQueryData<MessagesResponse>(queryKey, (old) => {
          if (!old) return old;
          const results = old.results.filter((m) => m.id !== context.tempId);
          return { count: Math.max(0, old.count - 1), results };
        });
      }
    },
    onSuccess: (message, _data, context) => {
      const sent: Message = { ...message, is_mine: true };
      queryClient.setQueryData<MessagesResponse>(queryKey, (old) => {
        if (!old) return { count: 1, results: [sent] };
        // Remplace le message optimiste par la version confirmée (anti-doublon).
        // On NE recalcule PAS `count` à partir du tableau : l'entrée optimiste
        // avait déjà incrémenté `count` dans `onMutate`. La remplacer doit donc
        // préserver `old.count` (cohérent avec le handler WS qui fait `count + 1`
        // uniquement à l'insertion d'un nouveau message).
        const withoutTemp = old.results.filter(
          (m) => m.id !== context?.tempId && m.id !== sent.id,
        );
        return {
          count: old.count,
          results: [...withoutTemp, sent],
        };
      });
    },
    onSettled: () => {
      // Re-sync la liste des conversations, même en cas d'échec d'envoi.
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
