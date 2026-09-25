import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, RequestBody, ResponseBody } from '@/types/api-contract';

const overrideSchema = z.object({ id: z.number(), diocese_node_id: z.string(), office: z.string(), capability: z.string() });
export type CapabilityOverride = z.infer<typeof overrideSchema>;

type _OverridesMatchContract = Expect<Matches<CapabilityOverride[], ResponseBody<'v1_hierarchy_capability_overrides_list'>>>;
// Le schéma partage le type d'entrée et de sortie : l'identifiant est en lecture seule.
export type OverrideBody = Omit<RequestBody<'v1_hierarchy_capability_overrides_create'>, 'id'>;

const KEY = ['referentiels', 'overrides'] as const;

/** Retraits de capacités par diocèse (plateforme.admin). */
export const useOverrides = () =>
  useQuery({ queryKey: KEY, queryFn: async () => z.array(overrideSchema).parse(await api.get('/hierarchy/capability-overrides/')) });

export const useCreateOverride = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: OverrideBody) => overrideSchema.parse(await api.post('/hierarchy/capability-overrides/', body)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeleteOverride = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/hierarchy/capability-overrides/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
};
