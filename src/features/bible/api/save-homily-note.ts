import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { homilyNoteSchema } from './get-homily-notes';
import type { HomilyNote } from './get-homily-notes';

export type SaveHomilyNoteInput = {
  passage_start_id: number;
  passage_end_id?: number | null;
  content: string;
};

export const useSaveHomilyNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveHomilyNoteInput): Promise<HomilyNote> =>
      api
        .post<unknown>('/v1/bible/homilenotes/', data)
        .then((res) => homilyNoteSchema.parse(res)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['homily-notes', variables.passage_start_id],
      });
    },
  });
};
