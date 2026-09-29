import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { dayjs } from '@/utils/dates';

import { type QueuePage, queuePageSchema } from '../types/processing';

export const QUEUE_PAGE_SIZE = 12;

/** Période de réception (maquette PAR-Demandes). */
export const PERIODS = [
  { value: '7j', label: '7 derniers jours' },
  { value: '30j', label: '30 derniers jours' },
  { value: 'mois', label: 'Ce mois-ci' },
] as const;
export type Period = (typeof PERIODS)[number]['value'];

/** Assignation : « moi » ou « à assigner » (le filtre par personne reste côté serveur). */
export const ASSIGNEE_FILTERS = [
  { value: 'moi', label: 'Assignées à moi', api: 'me' },
  { value: 'aucun', label: 'À assigner', api: 'none' },
] as const;
export type AssigneeFilter = (typeof ASSIGNEE_FILTERS)[number]['value'];

export type QueueFilters = {
  statut: string;
  type: string;
  motif: string;
  periode: Period | '';
  assigne: AssigneeFilter | '';
  q: string;
  retard: boolean;
  page: number;
};

const ISO = 'YYYY-MM-DD';

/** Bornes de réception envoyées au serveur (dates locales, bornes incluses). */
export const periodRange = (period: Period | '', today = dayjs()): { received_from?: string; received_to?: string } => {
  if (period === '7j') return { received_from: today.subtract(6, 'day').format(ISO) };
  if (period === '30j') return { received_from: today.subtract(29, 'day').format(ISO) };
  if (period === 'mois') return { received_from: today.startOf('month').format(ISO) };
  return {};
};

/** File de traitement du nœud (actes.traiter), filtrée côté serveur. */
export const getQueue = async (nodeId: string, f: QueueFilters): Promise<QueuePage> =>
  queuePageSchema.parse(
    await api.get('/staff/documents/', {
      params: {
        node: nodeId,
        status: f.statut || undefined,
        document_type: f.type || undefined,
        reason: f.motif || undefined,
        assignee: ASSIGNEE_FILTERS.find((a) => a.value === f.assigne)?.api,
        ...periodRange(f.periode),
        search: f.q.trim() || undefined,
        overdue: f.retard || undefined,
        limit: QUEUE_PAGE_SIZE,
        offset: (f.page - 1) * QUEUE_PAGE_SIZE,
      },
    }),
  );

export const queueQueryOptions = (nodeId: string, filters: QueueFilters) =>
  queryOptions({
    queryKey: ['demandes', nodeId, 'file', filters],
    queryFn: () => getQueue(nodeId, filters),
    placeholderData: keepPreviousData,
  });

export const useQueue = (nodeId: string, filters: QueueFilters) => useQuery(queueQueryOptions(nodeId, filters));
