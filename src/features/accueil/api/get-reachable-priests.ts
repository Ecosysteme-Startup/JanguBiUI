import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Doublon assumé de la feature `pretres` : l'accueil n'en montre qu'un.
const priestSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  nodes: z.array(z.object({ id: z.string(), name: z.string(), type: z.string() })),
  availability: z.object({ accepts_new_conversations: z.boolean() }).passthrough().nullable(),
  office: z.object({ code: z.string(), label: z.string() }).nullable(),
});
export type ReachablePriest = z.infer<typeof priestSchema>;

export const getReachablePriests = async () => z.array(priestSchema).parse(await api.get('/messaging/priests/'));

export const reachablePriestsQueryOptions = () =>
  queryOptions({ queryKey: ['accueil', 'pretres'], queryFn: getReachablePriests, staleTime: 10 * 60 * 1000 });

export const useReachablePriests = () => useQuery(reachablePriestsQueryOptions());
