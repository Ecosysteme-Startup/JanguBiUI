import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type Imperee, type ImpereeFollowRow, impereeFollowRowSchema, impereeSchema } from '../types/schemas';

export type ImpereeCreateBody = RequestBody<'staff_dons_imperees_create'>;

/** Quêtes impérées du diocèse (dons.definir_quete_imperee). */
export const getImperees = async (nodeId: string): Promise<Imperee[]> =>
  impereeSchema.array().parse(await api.get('/staff/dons/quetes-imperees/', { params: { node: nodeId } }));

export const impereesQueryOptions = (nodeId: string) => queryOptions({ queryKey: ['dons', nodeId, 'imperees'], queryFn: () => getImperees(nodeId) });

export const useImperees = (nodeId: string) => useQuery(impereesQueryOptions(nodeId));

/** Suivi par paroisse : agrégats seulement (RG-11), aucune donnée nominative. */
export const getImpereeFollow = async (fundId: string): Promise<ImpereeFollowRow[]> =>
  impereeFollowRowSchema.array().parse(await api.get(`/staff/dons/quetes-imperees/${encodeURIComponent(fundId)}/suivi/`));

export const impereeFollowQueryOptions = (fundId: string) =>
  queryOptions({ queryKey: ['dons', 'imperees', fundId, 'suivi'], queryFn: () => getImpereeFollow(fundId) });

export const useImpereeFollow = (fundId: string | undefined) => useQuery({ ...impereeFollowQueryOptions(fundId ?? ''), enabled: Boolean(fundId) });

export const createImperee = async (body: ImpereeCreateBody): Promise<Imperee> =>
  impereeSchema.parse(await api.post('/staff/dons/quetes-imperees/', body));

export const useCreateImperee = (nodeId: string, { onSuccess }: { onSuccess?: (i: Imperee) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createImperee,
    onSuccess: async (imperee) => {
      await queryClient.invalidateQueries({ queryKey: ['dons', nodeId, 'imperees'] });
      onSuccess?.(imperee);
    },
  });
};
