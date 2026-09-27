import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type CashCollection, type CashCollectionPage, cashCollectionPageSchema, cashCollectionSchema } from '../types/schemas';

export type CashCollectionBody = RequestBody<'staff_dons_cash_create'>;
export type CashRejectBody = RequestBody<'staff_dons_cash_reject'>;

const base = '/staff/dons/quetes/';

/** Saisies de quêtes en espèces du nœud (dons.saisir_quete). */
export const getCashCollections = async (nodeId: string, f: { status?: string; page?: number } = {}): Promise<CashCollectionPage> =>
  cashCollectionPageSchema.parse(
    await api.get(base, { params: { node: nodeId, status: f.status, limit: 20, offset: ((f.page ?? 1) - 1) * 20 } }),
  );

export const cashCollectionsQueryOptions = (nodeId: string, f: { status?: string; page?: number } = {}) =>
  queryOptions({ queryKey: ['dons', nodeId, 'quetes', f], queryFn: () => getCashCollections(nodeId, f), placeholderData: keepPreviousData });

export const useCashCollections = (nodeId: string, f: { status?: string; page?: number } = {}) => useQuery(cashCollectionsQueryOptions(nodeId, f));

export const createCashCollection = async (body: CashCollectionBody): Promise<CashCollection> =>
  cashCollectionSchema.parse(await api.post(base, body));
/** Validation par une autre personne que celle qui a saisi (contrôlé par le serveur). */
export const validateCashCollection = async (id: number): Promise<CashCollection> =>
  cashCollectionSchema.parse(await api.post(`${base}${id}/valider/`));
export const rejectCashCollection = async ({ id, body }: { id: number; body: CashRejectBody }): Promise<CashCollection> =>
  cashCollectionSchema.parse(await api.post(`${base}${id}/rejeter/`, body));

const useCashMutation = <V>(nodeId: string, fn: (v: V) => Promise<CashCollection>, onSuccess?: (c: CashCollection) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['dons', nodeId] });
      onSuccess?.(result);
    },
  });
};

export const useCreateCashCollection = (nodeId: string, o: { onSuccess?: (c: CashCollection) => void } = {}) =>
  useCashMutation(nodeId, createCashCollection, o.onSuccess);
export const useValidateCashCollection = (nodeId: string, o: { onSuccess?: (c: CashCollection) => void } = {}) =>
  useCashMutation(nodeId, validateCashCollection, o.onSuccess);
export const useRejectCashCollection = (nodeId: string, o: { onSuccess?: (c: CashCollection) => void } = {}) =>
  useCashMutation(nodeId, rejectCashCollection, o.onSuccess);
