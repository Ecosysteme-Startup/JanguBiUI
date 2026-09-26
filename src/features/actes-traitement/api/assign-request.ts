import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type ProcessorRequest, processorRequestSchema } from '../types/processing';

export type AssignBody = RequestBody<'staff_documents_assign'>;

/** Confie la demande à une personne de l'équipe, ou la remet « à assigner » (`assignee_id: null`). */
export const assignRequest = async ({ id, body }: { id: string; body: AssignBody }): Promise<ProcessorRequest> =>
  processorRequestSchema.parse(await api.post(`/staff/documents/${encodeURIComponent(id)}/assign/`, body));

export const useAssignRequest = (nodeId: string, { onSuccess }: { onSuccess?: (r: ProcessorRequest) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignRequest,
    onSuccess: async (request) => {
      queryClient.setQueryData(['demandes', nodeId, 'detail', request.id], request);
      await queryClient.invalidateQueries({ queryKey: ['demandes', nodeId, 'file'] });
      onSuccess?.(request);
    },
  });
};
