import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/** Tableau de bord plateforme (GET /dashboards/platform/, EF-DASH-03). */
export const platformDashboardSchema = z.object({
  generated_at: z.string(),
  accounts: z.object({ total: z.number(), active_30d: z.number(), new_30d: z.number() }),
  staff: z.object({ total: z.number(), with_mfa_30d: z.number(), mfa_share: z.number().nullable() }),
  health: z.object({ emails_failed_7d: z.number(), document_requests_overdue: z.number(), beat_stale: z.number() }),
  beat: z.array(
    z.object({ name: z.string(), task: z.string(), enabled: z.boolean(), last_run_at: z.string().nullable(), stale: z.boolean() }),
  ),
});
export type PlatformDashboard = z.infer<typeof platformDashboardSchema>;

export const getPlatformDashboard = async (): Promise<PlatformDashboard> =>
  platformDashboardSchema.parse(await api.get('/dashboards/platform/'));

export const platformDashboardQueryOptions = () =>
  queryOptions({ queryKey: ['dashboards', 'platform'], queryFn: getPlatformDashboard, refetchInterval: 60 * 1000 });

export const usePlatformDashboard = () => useQuery(platformDashboardQueryOptions());
