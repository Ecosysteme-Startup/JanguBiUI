import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Journal d'audit : `GET /v1/audit/` (capacité `audit.voir`, MFA).
// Contrat : backend AuditEventOutputSerializer (IP tronquée).

export const evenementAuditSchema = z.object({
  id: z.union([z.number(), z.string()]),
  at: z.string(),
  actor_id: z.string().nullable(),
  actor_name: z.string().nullable(),
  action: z.string(),
  target_type: z.string(),
  target_id: z.string(),
  node_id: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  ip: z.string().nullable(),
});
export type EvenementAudit = z.infer<typeof evenementAuditSchema>;

export const AUDIT_PAR_PAGE = 50;

export type FiltresAudit = {
  node?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  offset?: number;
};

export const useAudit = (f: FiltresAudit, enabled = true) =>
  useQuery({
    queryKey: ['audit', f],
    queryFn: async () =>
      z
        .object({ count: z.number(), results: z.array(evenementAuditSchema) })
        .parse(
          await api.get<unknown>('/v1/audit/', {
            params: {
              node: f.node,
              action: f.action?.trim() || undefined,
              date_from: f.date_from || undefined,
              date_to: f.date_to || undefined,
              limit: AUDIT_PAR_PAGE,
              offset: f.offset ?? 0,
            },
            quiet: true,
          }),
        ),
    placeholderData: keepPreviousData,
    enabled,
  });
