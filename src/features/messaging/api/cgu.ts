import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// CGU de messagerie, acceptées une fois pour toutes les conversations :
// GET|POST /v1/messaging/cgu/ → {accepted, accepted_at}.
const cguSchema = z.object({
  accepted: z.boolean(),
  accepted_at: z.string().nullable(),
});
export type MessagingCgu = z.infer<typeof cguSchema>;

const cguKey = ['messaging', 'cgu'] as const;

const getMessagingCgu = async (): Promise<MessagingCgu> =>
  cguSchema.parse(await api.get<unknown>('/v1/messaging/cgu/'));

export const useMessagingCgu = () =>
  useQuery(
    queryOptions({
      queryKey: [...cguKey],
      queryFn: getMessagingCgu,
      staleTime: 5 * 60_000,
    }),
  );

export const useAcceptMessagingCgu = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<unknown>('/v1/messaging/cgu/').then((d) => cguSchema.parse(d)),
    onSuccess: (data) => qc.setQueryData(cguKey, data),
  });
};
