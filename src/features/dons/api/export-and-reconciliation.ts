import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';

import { api, saveBlob } from '@/lib/api-client';

import { type PayoutPage, payoutPageSchema, type Reconciliation, reconciliationSchema } from '../types/schemas';

export type ExportFile = 'csv' | 'xlsx';
export type Period = { date_from: string; date_to: string };

/** Export comptable (dons.exporter), inscrit au journal d'audit par le serveur. */
export const exportDonations = async ({ nodeId, period, fund, file }: { nodeId: string; period: Period; fund?: string; file: ExportFile }) => {
  const blob = await api.blob('/staff/dons/export/', { params: { node: nodeId, ...period, fund, fichier: file } });
  saveBlob(blob, `dons-${period.date_from}-${period.date_to}.${file}`);
};

export const useExportDonations = () => useMutation({ mutationFn: exportDonations });

/** Rapprochement de la période : payé en ligne, frais, affecté, espèces, reversé, écarts. */
export const getReconciliation = async (nodeId: string, period: Period): Promise<Reconciliation> =>
  reconciliationSchema.parse(await api.get('/staff/dons/rapprochement/', { params: { node: nodeId, ...period } }));

export const reconciliationQueryOptions = (nodeId: string, period: Period) =>
  queryOptions({ queryKey: ['dons', nodeId, 'rapprochement', period], queryFn: () => getReconciliation(nodeId, period) });

export const useReconciliation = (nodeId: string, period: Period) => useQuery(reconciliationQueryOptions(nodeId, period));

/** Reversements de l'agrégateur (au diocèse, H1). */
export const getPayouts = async (nodeId: string): Promise<PayoutPage> =>
  payoutPageSchema.parse(await api.get('/staff/dons/reversements/', { params: { node: nodeId, limit: 20 } }));

export const payoutsQueryOptions = (nodeId: string) => queryOptions({ queryKey: ['dons', nodeId, 'reversements'], queryFn: () => getPayouts(nodeId) });

export const usePayouts = (nodeId: string) => useQuery(payoutsQueryOptions(nodeId));
