import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { conversationSchema, type Conversation } from './schemas';

export const archiveConversation = async (id: string): Promise<Conversation> =>
  conversationSchema.parse(
    await api.post(
      `/messaging/conversations/${encodeURIComponent(id)}/archive/`,
    ),
  );

export const useArchiveConversation = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveConversation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['messagerie'] });
      onSuccess?.();
    },
  });
};
