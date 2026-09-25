import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

export type ProfileInput = RequestBody<'v1_me_partial_update'>;

/** Champs du profil seulement ; l'e-mail et le mot de passe se gèrent dans Keycloak. */
export const updateProfile = (input: ProfileInput) => api.patch('/me/', input);

export const useUpdateProfile = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      onSuccess?.();
    },
  });
};
