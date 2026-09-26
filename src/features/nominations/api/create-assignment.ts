import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type Assignment, assignmentSchema } from './get-assignments';

export type AssignmentCreateBody = RequestBody<'v1_hierarchy_assignments_create'>;

/** Nommer une personne à un office (offices.nommer + office « nommeur », MFA). Inscrit au journal d'audit. */
export const createAssignment = async (body: AssignmentCreateBody): Promise<Assignment> =>
  assignmentSchema.parse(await api.post('/hierarchy/assignments/', body));

export const useCreateAssignment = ({ onSuccess }: { onSuccess?: (a: Assignment) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssignment,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['nominations'] });
      onSuccess?.(created);
    },
  });
};
