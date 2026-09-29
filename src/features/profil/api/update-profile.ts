import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

// PATCH /v1/me/ (MeProfileSerializer) : e-mail et mot de passe sont dans Keycloak.
export type UpdateProfileInput = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  title?: string;
  date_of_birth?: string;
};

export const useUpdateProfile = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      api.patch<unknown>('/v1/me/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      onSuccess?.();
    },
  });
};
