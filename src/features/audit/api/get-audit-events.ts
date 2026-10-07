import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

const eventSchema = z.object({
  id: z.number(),
  at: z.string(),
  actor_id: z.string().nullable(),
  actor_name: z.string().nullable(),
  action: z.string(),
  target_type: z.string(),
  target_id: z.string(),
  node_id: z.string().nullable(),
  /** Nom lisible du nœud, quand le backend le fournit (sinon résolu côté front, cf. JB-WEB-039). */
  node_name: z.string().nullish(),
  metadata: z.unknown().optional(),
  // Tronquée par le backend (IPv4 /24, IPv6 /48) ; null pour une action du système.
  ip: z.string().nullable(),
});
export type AuditEvent = z.infer<typeof eventSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(eventSchema) });
type AuditPage = z.infer<typeof pageSchema>;
type _AuditMatchesContract = Expect<Matches<AuditPage['results'], ResponseBody<'audit_events_list'>['results']>>;

/** Filtres du journal, tels qu'ils figurent dans l'URL. */
export type AuditFilters = {
  node?: string;
  actor?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  offset?: number;
};

export const AUDIT_PAGE = 25;

export const getAuditEvents = async ({ offset = 0, ...filters }: AuditFilters): Promise<AuditPage> =>
  pageSchema.parse(await api.get('/audit/', { params: { ...filters, limit: AUDIT_PAGE, offset } }));

/** Journal d'audit (audit.voir sur un nœud, ou plateforme). */
export const useAuditEvents = (filters: AuditFilters) =>
  useQuery({ queryKey: ['audit', filters], queryFn: () => getAuditEvents(filters), placeholderData: keepPreviousData });
