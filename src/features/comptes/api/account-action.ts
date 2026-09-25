import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type AccountDetail, accountDetailSchema, accountKeys } from './account-schema';

export type AccountAction = 'lock' | 'unlock' | 'logout-sessions' | 'require-mfa';

/** Actions de sécurité sur un compte Keycloak (POST /platform/accounts/{id}/{action}/). */
export const runAccountAction = async ({ id, action }: { id: string; action: AccountAction }): Promise<AccountDetail> =>
  accountDetailSchema.parse(await api.post(`/platform/accounts/${encodeURIComponent(id)}/${action}/`));

export const useAccountAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runAccountAction,
    onSuccess: (detail) => {
      queryClient.setQueryData(accountKeys.detail(detail.id), detail);
      return queryClient.invalidateQueries({ queryKey: [...accountKeys.all, 'list'] });
    },
  });
};
