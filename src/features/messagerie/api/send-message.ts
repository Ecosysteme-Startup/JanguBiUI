import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { mergeMessage, messagesQueryKey } from './get-messages';
import { messageSchema, type Message } from './schemas';

type SendBody = RequestBody<'v1_messaging_conversations_messages_send_create'>;

export const sendMessage = async (
  conversationId: string,
  body: SendBody,
): Promise<Message> =>
  messageSchema.parse(
    await api.post(
      `/messaging/conversations/${encodeURIComponent(conversationId)}/messages/send/`,
      body,
    ),
  );

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      sendMessage(conversationId, {
        content,
        client_message_id: crypto.randomUUID(),
      }),
    onSuccess: async (message) => {
      queryClient.setQueryData<Message[]>(
        messagesQueryKey(conversationId),
        (list) => mergeMessage(list, message),
      );
      await queryClient.invalidateQueries({
        queryKey: ['messagerie', 'conversations'],
      });
    },
  });
};
