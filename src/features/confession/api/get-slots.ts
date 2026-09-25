import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { pageOf, type Slot, slotSchema } from './schemas';

/** Maximum de la pagination du backend (LimitOffsetPagination, max 50). */
const LIMIT = 50;

/** Créneaux LIBRES à venir de la paroisse (sous-arbre compris), à partir d'une date. */
export const getSlots = async (
  nodeId: string,
  dateFrom: string,
): Promise<Slot[]> =>
  pageOf(slotSchema).parse(
    await api.get('/confessions/slots/', {
      params: { node: nodeId, date_from: dateFrom, limit: LIMIT },
    }),
  ).results;

export const slotsQueryOptions = (nodeId: string | null, dateFrom: string) =>
  queryOptions({
    queryKey: ['confession', 'creneaux', nodeId, dateFrom],
    queryFn: () => getSlots(nodeId!, dateFrom),
    enabled: Boolean(nodeId),
    placeholderData: keepPreviousData,
  });

export const useSlots = (nodeId: string | null, dateFrom: string) =>
  useQuery(slotsQueryOptions(nodeId, dateFrom));
