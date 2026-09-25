import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const markRead = (conversationId: string) =>
  api.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/read/`,
  );

/** Marque le fil comme lu (le compteur de non-lus de la liste se met à jour). */
export const useMarkRead = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markRead(conversationId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['messagerie', 'conversations'],
      }),
  });
};
