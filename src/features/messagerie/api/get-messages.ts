import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { messageSchema, type Message } from './schemas';

/** Intervalle du repli REST quand le temps réel est indisponible (spec §3). */
export const POLL_INTERVAL_MS = 15_000;
const PAGE = 50;

/** L'API renvoie les plus récents d'abord : on remet le fil dans l'ordre de lecture. */
export const getMessages = async (
  conversationId: string,
): Promise<Message[]> => {
  const data = await api.get(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/messages/`,
    {
      params: { limit: PAGE },
    },
  );
  return z.array(messageSchema).parse(data).reverse();
};

export const messagesQueryKey = (conversationId: string) =>
  ['messagerie', 'messages', conversationId] as const;

export const messagesQueryOptions = (conversationId: string) =>
  queryOptions({
    queryKey: messagesQueryKey(conversationId),
    queryFn: () => getMessages(conversationId),
  });

export const useMessages = (
  conversationId: string,
  { enabled, poll }: { enabled: boolean; poll: boolean },
) =>
  useQuery({
    ...messagesQueryOptions(conversationId),
    enabled,
    refetchInterval: poll ? POLL_INTERVAL_MS : false,
  });

/** Ajoute un message au fil sans doublon (l'écho du socket et la réponse REST se croisent). */
export const mergeMessage = (
  list: Message[] | undefined,
  message: Message,
): Message[] => {
  const current = list ?? [];
  const duplicate = current.some(
    (m) =>
      m.id === message.id ||
      (message.client_message_id &&
        m.client_message_id === message.client_message_id),
  );
  return duplicate ? current : [...current, message];
};
