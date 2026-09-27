import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type Operation, type OperationPage, operationPageSchema, operationSchema } from '../types/schemas';

export const OPERATIONS_PAGE_SIZE = 10;

export type OperationsFilters = {
  fund?: string;
  status?: string;
  channel?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
};

/** Opérations du nœud ; le nom du donateur n'apparaît qu'avec dons.voir_donateurs (côté serveur). */
export const getOperations = async (nodeId: string, f: OperationsFilters = {}): Promise<OperationPage> =>
  operationPageSchema.parse(
    await api.get('/staff/dons/operations/', {
      params: {
        node: nodeId,
        fund: f.fund,
        status: f.status,
        channel: f.channel,
        date_from: f.date_from,
        date_to: f.date_to,
        limit: OPERATIONS_PAGE_SIZE,
        offset: ((f.page ?? 1) - 1) * OPERATIONS_PAGE_SIZE,
      },
    }),
  );

export const operationsQueryOptions = (nodeId: string, f: OperationsFilters = {}) =>
  queryOptions({ queryKey: ['dons', nodeId, 'operations', f], queryFn: () => getOperations(nodeId, f), placeholderData: keepPreviousData });

export const useOperations = (nodeId: string, f: OperationsFilters = {}) => useQuery(operationsQueryOptions(nodeId, f));

export type RefundBody = RequestBody<'staff_dons_refund'>;

/** Remboursement (dons.gerer_fonds) : le don passe à « Remboursé », jamais à un autre fonds. */
export const refundDonation = async ({ id, body }: { id: string; body: RefundBody }): Promise<Operation> =>
  operationSchema.parse(await api.post(`/staff/dons/operations/${encodeURIComponent(id)}/rembourser/`, body));

export const useRefundDonation = (nodeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: refundDonation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dons', nodeId] }) });
};
