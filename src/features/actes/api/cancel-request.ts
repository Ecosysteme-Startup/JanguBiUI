import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { requestSchema } from '../types/request';

/** EF-ACT-07 : annulation tant que la demande est soumise ou en attente de complément. */
export const cancelRequest = async (id: string) =>
  requestSchema.parse(await api.post(`/documents/requests/${encodeURIComponent(id)}/cancel/`));

export const useCancelRequest = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelRequest,
    onSuccess: async () => {
      // Le retour de l'annulation n'a pas l'historique : on recharge liste et détail.
      await queryClient.invalidateQueries({ queryKey: ['demandes', 'mine'] });
      onSuccess?.();
    },
  });
};
