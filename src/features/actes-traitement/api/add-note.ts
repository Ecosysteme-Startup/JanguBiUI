import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type InternalNote, noteSchema } from '../types/processing';

export type NoteBody = RequestBody<'v1_staff_documents_notes_create'>;

export const addNote = async ({ id, body }: { id: string; body: NoteBody }): Promise<InternalNote> =>
  noteSchema.parse(await api.post(`/staff/documents/${encodeURIComponent(id)}/notes/`, body));

export const useAddNote = (nodeId: string, id: string, { onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['demandes', nodeId, 'notes', id] });
      onSuccess?.();
    },
  });
};
