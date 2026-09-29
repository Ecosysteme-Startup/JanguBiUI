import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type ProcessorRequest, processorRequestSchema } from '../types/processing';

export type RegisterRefBody = RequestBody<'v1_staff_documents_register_ref_update'>;

/** Références du registre (EF-ACT-05) : jamais renvoyées au fidèle. */
export const setRegisterRef = async ({ id, body }: { id: string; body: RegisterRefBody }): Promise<ProcessorRequest> =>
  processorRequestSchema.parse(await api.put(`/staff/documents/${encodeURIComponent(id)}/register-ref/`, body));

export const useSetRegisterRef = (nodeId: string, { onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setRegisterRef,
    onSuccess: async (request) => {
      await queryClient.invalidateQueries({ queryKey: ['demandes', nodeId, 'detail', request.id] });
      onSuccess?.();
    },
  });
};
