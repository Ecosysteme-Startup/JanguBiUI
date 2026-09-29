import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { type Account, accountKeys, accountSchema } from './account-schema';

export type AccountFilters = {
  q?: string;
  role?: Account['realm_role'];
  mfa?: 'active' | 'facultative';
  status?: Account['status'];
  offset?: number;
};

export const ACCOUNTS_PAGE = 12;
const pageSchema = z.object({ count: z.number(), results: z.array(accountSchema) });

export const getAccounts = async ({ offset = 0, ...filters }: AccountFilters) =>
  pageSchema.parse(await api.get('/platform/accounts/', { params: { ...filters, limit: ACCOUNTS_PAGE, offset } }));

/** Comptes du realm (plateforme.admin). */
export const useAccounts = (filters: AccountFilters) =>
  useQuery({ queryKey: accountKeys.list(filters), queryFn: () => getAccounts(filters), placeholderData: keepPreviousData });
