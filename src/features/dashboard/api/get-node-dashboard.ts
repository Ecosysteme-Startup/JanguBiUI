import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Tableaux de bord V1 (backend apps/dashboards/selectors.py) : agrégats du
// sous-arbre d'un nœud, jamais de donnée nominative. Réponse mise en cache
// 5 minutes côté serveur.

export const PERIODES = [7, 30, 90, 365] as const;
export type Periode = (typeof PERIODES)[number];

const n = z.number().nullable();

export const tableauNoeudSchema = z.object({
  node: z.object({ id: z.string(), name: z.string(), type: z.string() }),
  period_days: z.number(),
  generated_at: z.string(),
  fideles: z.object({ attached: z.number(), active: z.number(), new: z.number() }),
  annonces: z.object({
    published: z.number(),
    reads: z.number(),
    reads_per_article: n,
  }),
  evenements: z.object({ upcoming: z.number(), registrations: z.number() }),
  actes: z
    .object({
      counts: z.record(z.string(), z.number()).optional(),
      total: z.number().optional(),
      received: z.number(),
      median_days_to_collect: n,
      overdue: z.number(),
    })
    .passthrough(),
  messagerie: z.object({
    conversations: z.number(),
    median_first_reply_hours: n,
    unanswered_48h: z.number(),
  }),
  confessions: z.object({
    slots_offered: z.number(),
    booked: z.number(),
    honoured: z.number(),
    absent: z.number(),
    cancelled: z.number(),
    upcoming_booked: z.number(),
  }),
});
export type TableauNoeud = z.infer<typeof tableauNoeudSchema>;

/** `GET /v1/dashboards/nodes/{id}/?period=` (capacité `tableau_bord.voir`). */
export const useTableauNoeud = (nodeId: string | undefined, period: Periode) =>
  useQuery({
    queryKey: ['dashboards', 'node', nodeId, period],
    queryFn: async () =>
      tableauNoeudSchema.parse(
        await api.get<unknown>(
          `/v1/dashboards/nodes/${encodeURIComponent(nodeId ?? '')}/`,
          { params: { period }, quiet: true },
        ),
      ),
    enabled: !!nodeId,
    retry: false,
  });

export const tableauPlateformeSchema = z.object({
  generated_at: z.string(),
  accounts: z.object({
    total: z.number(),
    active_30d: z.number(),
    new_30d: z.number(),
  }),
  staff: z.object({
    total: z.number(),
    with_mfa_30d: z.number(),
    mfa_share: n,
  }),
  health: z.object({
    emails_failed_7d: z.number(),
    document_requests_overdue: z.number(),
    beat_stale: z.number(),
  }),
  beat: z.array(
    z.object({
      name: z.string(),
      task: z.string(),
      enabled: z.boolean(),
      last_run_at: z.string().nullable(),
      stale: z.boolean(),
    }),
  ),
});
export type TableauPlateforme = z.infer<typeof tableauPlateformeSchema>;

/** `GET /v1/dashboards/platform/` (capacité `plateforme.admin`). */
export const useTableauPlateforme = (enabled = true) =>
  useQuery({
    queryKey: ['dashboards', 'platform'],
    queryFn: async () =>
      tableauPlateformeSchema.parse(
        await api.get<unknown>('/v1/dashboards/platform/', { quiet: true }),
      ),
    enabled,
    retry: false,
  });
