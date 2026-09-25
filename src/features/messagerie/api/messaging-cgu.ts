import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const cguSchema = z.object({
  accepted: z.boolean(),
  accepted_at: z.string().nullable(),
});
export type MessagingCgu = z.infer<typeof cguSchema>;

export const getMessagingCgu = async (): Promise<MessagingCgu> =>
  cguSchema.parse(await api.get('/messaging/cgu/'));
export const acceptMessagingCgu = async (): Promise<MessagingCgu> =>
  cguSchema.parse(await api.post('/messaging/cgu/'));

export const messagingCguQueryOptions = () =>
  queryOptions({ queryKey: ['messagerie', 'cgu'], queryFn: getMessagingCgu });

export const useMessagingCgu = () => useQuery(messagingCguQueryOptions());

export const useAcceptMessagingCgu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptMessagingCgu,
    onSuccess: (data) => queryClient.setQueryData(['messagerie', 'cgu'], data),
  });
};
