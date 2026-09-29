import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type DocumentRequest, requestSchema } from '../types/request';

export type CreateRequestBody = RequestBody<'v1_documents_requests_create'>;

/** Dépôt à la paroisse du sacrement (RG-02). */
export const createRequest = async (body: CreateRequestBody): Promise<DocumentRequest> =>
  requestSchema.parse(await api.post('/documents/requests/', body));

export const useCreateRequest = ({ onSuccess }: { onSuccess?: (request: DocumentRequest) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequest,
    onSuccess: async (request) => {
      await queryClient.invalidateQueries({ queryKey: ['demandes', 'mine'] });
      onSuccess?.(request);
    },
  });
};
