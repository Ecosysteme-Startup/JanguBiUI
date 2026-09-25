import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

type CreateBody = RequestBody<'v1_messaging_conversations_create_create'>;

const createdSchema = z.object({ id: z.string() });

/** Ouvre (ou retrouve) la conversation avec un prêtre joignable. Refus 403 `minor` si le fidèle est mineur. */
export const createConversation = async (
  priestUserId: string,
): Promise<{ id: string }> => {
  const body: CreateBody = { priest_user_id: priestUserId };
  return createdSchema.parse(
    await api.post('/messaging/conversations/create/', body),
  );
};

export const useCreateConversation = ({
  onSuccess,
}: { onSuccess?: (id: string) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({
        queryKey: ['messagerie', 'conversations'],
      });
      onSuccess?.(id);
    },
  });
};
