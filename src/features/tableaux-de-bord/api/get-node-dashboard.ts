import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/**
 * Tableau de bord d'un nœud (GET /dashboards/nodes/{id}/, EF-DASH-01/02).
 * Le schéma ne retient QUE des agrégats : tout champ supplémentaire (nom, e-mail…)
 * est écarté à l'analyse et ne peut donc jamais s'afficher (RG-09).
 */
const count = z.number().int().nonnegative();

export const nodeDashboardSchema = z.object({
  node: z.object({ id: z.string(), name: z.string(), type: z.string() }),
  period_days: z.number(),
  generated_at: z.string(),
  fideles: z.object({ attached: count, active: count, new: count }),
  annonces: z.object({ published: count, reads: count, reads_per_article: z.number().nullable() }),
  evenements: z.object({ upcoming: count, registrations: count }),
  actes: z.object({
    counts: z.record(z.string(), count),
    total: count,
    received: count,
    median_days_to_collect: z.number().nullable(),
    overdue: count,
  }),
  messagerie: z.object({ conversations: count, median_first_reply_hours: z.number().nullable(), unanswered_48h: count }),
  confessions: z.object({
    slots_offered: count,
    booked: count,
    honoured: count,
    absent: count,
    cancelled: count,
    upcoming_booked: count,
  }),
});
export type NodeDashboard = z.infer<typeof nodeDashboardSchema>;

export const DASHBOARD_PERIOD = 30;

export const getNodeDashboard = async (nodeId: string, period = DASHBOARD_PERIOD): Promise<NodeDashboard> =>
  nodeDashboardSchema.parse(await api.get(`/dashboards/nodes/${encodeURIComponent(nodeId)}/`, { params: { period } }));

export const nodeDashboardQueryOptions = (nodeId: string, period = DASHBOARD_PERIOD) =>
  queryOptions({ queryKey: ['dashboards', 'nodes', nodeId, period], queryFn: () => getNodeDashboard(nodeId, period) });

export const useNodeDashboard = (nodeId: string, period = DASHBOARD_PERIOD) => useQuery(nodeDashboardQueryOptions(nodeId, period));
