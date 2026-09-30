import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

import { type StaffFund, staffFundSchema } from '../types/schemas';

type _ProposedFunds = Expect<Matches<StaffFund[], ResponseBody<'staff_dons_cash_funds'>>>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fonds proposés pour la quête d'une messe à cette date (GET /staff/dons/quetes/fonds-proposes/) :
 * la quête impérée du jour d'abord, messe anticipée comprise selon le diocèse, puis la quête dominicale.
 */
export const getProposedCashFunds = async (nodeId: string, date: string): Promise<StaffFund[]> =>
  staffFundSchema.array().parse(await api.get('/staff/dons/quetes/fonds-proposes/', { params: { node: nodeId, date } }));

export const proposedCashFundsQueryOptions = (nodeId: string, date: string) =>
  queryOptions({ queryKey: ['dons', nodeId, 'fonds-proposes', date], queryFn: () => getProposedCashFunds(nodeId, date) });

/** Réservé à `dons.saisir_quete` ; inactif tant que la date n'est pas complète. */
export const useProposedCashFunds = (nodeId: string, date: string) =>
  useQuery({ ...proposedCashFundsQueryOptions(nodeId, date), enabled: ISO_DATE.test(date), placeholderData: keepPreviousData });
