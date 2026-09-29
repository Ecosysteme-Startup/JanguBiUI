import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type Rule, ruleSchema } from './schemas';

export type RuleCreateBody = RequestBody<'v1_staff_confessions_rules_create'>;

export const getRules = async (): Promise<Rule[]> =>
  z.array(ruleSchema).parse(await api.get('/staff/confessions/rules/'));

export const createRule = async (body: RuleCreateBody): Promise<Rule> =>
  ruleSchema.parse(await api.post('/staff/confessions/rules/', body));

export const deleteRule = (ruleId: number) =>
  api.delete(`/staff/confessions/rules/${ruleId}/`);

export const rulesQueryOptions = () =>
  queryOptions({
    queryKey: ['confessions-planning', 'regles'],
    queryFn: getRules,
  });

export const useRules = ({ enabled }: { enabled: boolean }) =>
  useQuery({ ...rulesQueryOptions(), enabled });

/** Une règle crée (ou désactive) des créneaux : le planning est rechargé. */
const useInvalidating = <TArg, TResult>(
  fn: (arg: TArg) => Promise<TResult>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['confessions-planning'] }),
  });
};

export const useCreateRule = () => useInvalidating(createRule);
export const useDeleteRule = () => useInvalidating(deleteRule);
