import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type ProcessorRequest, processorRequestSchema } from '../types/processing';
import type { Transition } from '../utils/transitions';

export type TransitionBody = RequestBody<'v1_staff_documents_create'>;

export type TransitionInput = { id: string; transition: Transition; body: TransitionBody };

/** Fait avancer la demande (journal immuable + notification du fidèle côté serveur). */
export const transitionRequest = async ({ id, transition, body }: TransitionInput): Promise<ProcessorRequest> =>
  processorRequestSchema.parse(await api.post(`/staff/documents/${encodeURIComponent(id)}/${transition}/`, body));

export const useTransitionRequest = (nodeId: string, { onSuccess }: { onSuccess?: (r: ProcessorRequest) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transitionRequest,
    onSuccess: async (request) => {
      queryClient.setQueryData(['demandes', nodeId, 'detail', request.id], request);
      await queryClient.invalidateQueries({ queryKey: ['demandes', nodeId] });
      onSuccess?.(request);
    },
  });
};
