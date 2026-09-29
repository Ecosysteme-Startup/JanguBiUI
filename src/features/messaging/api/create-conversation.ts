import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { conversationSchema } from '../types';
import type { Conversation } from '../types';

export type CreateConversationInput = { priest_user_id: string };

export const useCreateConversation = ({
  onSuccess,
}: { onSuccess?: (conv: Conversation) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: CreateConversationInput,
    ): Promise<Conversation> => {
      const response = await api.post<unknown>(
        '/v1/messaging/conversations/create/',
        data,
        // Refus (mineur, date de naissance, indisponible) expliqués par l'écran.
        { quiet: true },
      );
      return conversationSchema.parse(response);
    },
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onSuccess?.(conv);
    },
  });
};
