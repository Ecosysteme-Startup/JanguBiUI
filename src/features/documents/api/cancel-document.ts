import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { requesterRequestSchema } from '../types';

/** `POST /v1/documents/requests/<uuid>/cancel/` (soumise ou complément demandé). */
export const useCancelDocument = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api
        .post<unknown>(`/v1/documents/requests/${id}/cancel/`)
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
