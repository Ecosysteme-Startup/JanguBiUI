import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type DocumentRequest, requestSchema } from '../types/request';

export type SupplementBody = RequestBody<'v1_documents_requests_supplement_create'>;

/** Réponse du fidèle à une demande de complément : la demande repasse en vérification. */
export const submitSupplement = async ({ id, body }: { id: string; body: SupplementBody }): Promise<DocumentRequest> =>
  requestSchema.parse(await api.post(`/documents/requests/${encodeURIComponent(id)}/supplement/`, body));

export const useSubmitSupplement = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitSupplement,
    onSuccess: async (request) => {
      queryClient.setQueryData(['demandes', 'mine', 'detail', request.id], request);
      await queryClient.invalidateQueries({ queryKey: ['demandes', 'mine'] });
      onSuccess?.();
    },
  });
};
