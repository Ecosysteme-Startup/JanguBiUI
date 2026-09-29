import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type Assignment, assignmentSchema } from './get-assignments';

type UpdateBody = RequestBody<'v1_hierarchy_assignments_partial_update'>;

/** Terminer (date de fin : aujourd'hui) ou annuler une nomination proposée. */
export const updateAssignment = async ({ id, action }: { id: number; action: UpdateBody['action'] }): Promise<Assignment> => {
  const body: UpdateBody = { action };
  return assignmentSchema.parse(await api.patch(`/hierarchy/assignments/${id}/`, body));
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAssignment,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['nominations'] }),
        queryClient.invalidateQueries({ queryKey: ['me', 'capacites'] }),
      ]),
  });
};

export const setAssignmentQuality = async ({ id, quality }: { id: number; quality: string }): Promise<Assignment> => {
  const body: UpdateBody = { action: 'qualifier', quality };
  return assignmentSchema.parse(await api.patch(`/hierarchy/assignments/${id}/`, body));
};

/** Change la qualité d'une nomination ; mes capacités (titre) sont relues si la nomination est la mienne. */
export const useSetAssignmentQuality = ({ meId }: { meId?: string } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setAssignmentQuality,
    onSuccess: (updated) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['nominations'] }),
        updated.person.id === meId ? queryClient.invalidateQueries({ queryKey: ['me', 'capacites'] }) : undefined,
      ]),
  });
};
