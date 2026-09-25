import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type AccountDetail, accountDetailSchema, accountKeys } from './account-schema';

export const getAccount = async (id: string): Promise<AccountDetail> =>
  accountDetailSchema.parse(await api.get(`/platform/accounts/${encodeURIComponent(id)}/`));

/** Fiche d'un compte : nominations, sessions, MFA. */
export const useAccount = (id: string | null) =>
  useQuery({ queryKey: accountKeys.detail(id ?? ''), queryFn: () => getAccount(id!), enabled: Boolean(id) });
