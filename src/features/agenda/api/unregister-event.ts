import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

/** `DELETE /v1/agenda/<id>/register/` (204). */
export const useUnregisterEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) =>
      api.delete<void>(`/v1/agenda/${eventId}/register/`, { quiet: true }),
    onSuccess: (_data, eventId) => {
      void queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};
