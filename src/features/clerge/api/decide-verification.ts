import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type PersonStatus, personStatusSchema } from './get-verifications';

export type DecisionBody = RequestBody<'v1_hierarchy_verifications_decision_create'>;

/** Vérifier ou rejeter une déclaration d'état de vie (inscrit au journal d'audit). */
export const decideVerification = async ({ personId, body }: { personId: string; body: DecisionBody }): Promise<PersonStatus> =>
  personStatusSchema.parse(await api.post(`/hierarchy/verifications/${encodeURIComponent(personId)}/decision/`, body));

export const useDecideVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decideVerification,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clerge'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboards', 'verifications-count'] }),
      ]),
  });
};
