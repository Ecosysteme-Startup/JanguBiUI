import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

/** Suppression du compte (EF-CONF-03) : anonymisation, purge des conversations ; irréversible. 409 si nomination en cours. */
export const deleteAccount = () => api.delete('/me/');

export const useDeleteAccount = ({ onSuccess }: { onSuccess?: () => void } = {}) =>
  useMutation({ mutationFn: deleteAccount, onSuccess });
