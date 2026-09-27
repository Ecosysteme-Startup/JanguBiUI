import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type FundNews, fundNewsSchema, type StaffFund, staffFundSchema } from '../types/schemas';

export type FundCreateBody = RequestBody<'staff_dons_funds_create'>;
export type FundUpdateBody = RequestBody<'staff_dons_funds_update'>;
export type FundNewsBody = RequestBody<'staff_dons_funds_news'>;

const base = '/staff/dons/fonds/';
const one = (id: string) => `${base}${encodeURIComponent(id)}/`;

/** Fonds du nœud (dons.voir_fonds), y compris les quêtes impérées reçues du diocèse. */
export const getStaffFunds = async (nodeId: string, f: { kind?: string; status?: string } = {}): Promise<StaffFund[]> =>
  staffFundSchema.array().parse(await api.get(base, { params: { node: nodeId, kind: f.kind, status: f.status } }));

export const staffFundsQueryOptions = (nodeId: string, f: { kind?: string; status?: string } = {}) =>
  queryOptions({ queryKey: ['dons', nodeId, 'fonds', f], queryFn: () => getStaffFunds(nodeId, f) });

export const useStaffFunds = (nodeId: string, f: { kind?: string; status?: string } = {}) => useQuery(staffFundsQueryOptions(nodeId, f));

export const getStaffFund = async (fundId: string): Promise<StaffFund> => staffFundSchema.parse(await api.get(one(fundId)));

export const staffFundQueryOptions = (fundId: string) =>
  queryOptions({ queryKey: ['dons', 'fonds-staff', fundId], queryFn: () => getStaffFund(fundId) });

export const useStaffFund = (fundId: string | undefined) => useQuery({ ...staffFundQueryOptions(fundId ?? ''), enabled: Boolean(fundId) });

export const createFund = async (body: FundCreateBody): Promise<StaffFund> => staffFundSchema.parse(await api.post(base, body));
export const updateFund = async ({ id, body }: { id: string; body: FundUpdateBody }): Promise<StaffFund> =>
  staffFundSchema.parse(await api.patch(one(id), body));
export const publishFund = async (id: string): Promise<StaffFund> => staffFundSchema.parse(await api.post(`${one(id)}publier/`));
export const closeFund = async (id: string): Promise<StaffFund> => staffFundSchema.parse(await api.post(`${one(id)}clore/`));
export const postFundNews = async ({ id, body }: { id: string; body: FundNewsBody }): Promise<FundNews> =>
  fundNewsSchema.parse(await api.post(`${one(id)}nouvelles/`, body));

const useFundMutation = <V, R>(nodeId: string, fn: (v: V) => Promise<R>, onSuccess?: (r: R) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['dons', nodeId] });
      onSuccess?.(result);
    },
  });
};

export const useCreateFund = (nodeId: string, o: { onSuccess?: (f: StaffFund) => void } = {}) => useFundMutation(nodeId, createFund, o.onSuccess);
export const useUpdateFund = (nodeId: string, o: { onSuccess?: (f: StaffFund) => void } = {}) => useFundMutation(nodeId, updateFund, o.onSuccess);
export const usePublishFund = (nodeId: string, o: { onSuccess?: (f: StaffFund) => void } = {}) => useFundMutation(nodeId, publishFund, o.onSuccess);
export const useCloseFund = (nodeId: string, o: { onSuccess?: (f: StaffFund) => void } = {}) => useFundMutation(nodeId, closeFund, o.onSuccess);
export const usePostFundNews = (nodeId: string, o: { onSuccess?: (n: FundNews) => void } = {}) => useFundMutation(nodeId, postFundNews, o.onSuccess);
