import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

type Body = RequestBody<'v1_me_paroisse_suivie_update'>;

/** Changer de paroisse suivie : libre, sans validation (RG-01). */
export const setFollowedParish = (nodeId: string | null) => {
  const body: Body = { node_id: nodeId };
  return api.put('/me/paroisse-suivie/', body);
};

export const useSetFollowedParish = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setFollowedParish,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await queryClient.invalidateQueries({ queryKey: ['paroisse'] });
      onSuccess?.();
    },
  });
};
