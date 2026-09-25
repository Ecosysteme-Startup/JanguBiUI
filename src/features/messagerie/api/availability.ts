import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

export const replyWindowSchema = z.object({
  weekday: z.coerce.number(),
  start: z.string(),
  end: z.string(),
});
export type ReplyWindow = z.infer<typeof replyWindowSchema>;

export const availabilitySchema = z.object({
  accepts_new_conversations: z.boolean().default(true),
  absent_until: z.string().nullable().default(null),
  reply_windows: z.array(replyWindowSchema).default([]),
  note: z.string().default(''),
});
export type Availability = z.infer<typeof availabilitySchema>;

type AvailabilityBody = RequestBody<'v1_messaging_availability_update'>;

export const getAvailability = async (): Promise<Availability> =>
  availabilitySchema.parse(await api.get('/messaging/availability/'));

export const updateAvailability = async (
  body: AvailabilityBody,
): Promise<Availability> =>
  availabilitySchema.parse(await api.put('/messaging/availability/', body));

export const availabilityQueryOptions = () =>
  queryOptions({
    queryKey: ['messagerie', 'disponibilite'],
    queryFn: getAvailability,
  });

export const useAvailability = () => useQuery(availabilityQueryOptions());

export const useUpdateAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAvailability,
    onSuccess: (data) =>
      queryClient.setQueryData(['messagerie', 'disponibilite'], data),
  });
};
