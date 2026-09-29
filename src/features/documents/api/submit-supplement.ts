import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { requesterRequestSchema } from '../types';

export type SubmitSupplementInput = {
  additional_info?: string;
  document_details?: Record<string, string>;
  /** Pièce jointe déjà téléversée (`POST /v1/files/upload/standard/`). */
  attachment_file_id?: number | null;
};

/** `POST /v1/documents/requests/<uuid>/supplement/` → la demande à jour. */
export const useSubmitSupplement = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitSupplementInput) =>
      api
        .post<unknown>(`/v1/documents/requests/${id}/supplement/`, data)
        .then((d) => requesterRequestSchema.parse(d)),
    onSuccess: (data) => {
      queryClient.setQueryData(['documents', 'requests', 'detail', id], data);
      // Listes seulement : le détail vient d'être remplacé par la réponse.
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'requests'],
        predicate: (q) => q.queryKey[2] !== 'detail',
      });
    },
  });
};
