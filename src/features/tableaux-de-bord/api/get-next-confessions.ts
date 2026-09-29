import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { dayjs } from '@/utils/dates';

/**
 * Planning de confessions du nœud (GET /staff/confessions/planning/), pour l'aperçu du
 * prochain jour ouvert. Doublon assumé de la feature confessions-planning : seuls l'heure,
 * le prêtre et l'état du créneau sont lus, jamais la personne qui a réservé.
 */
const slotSchema = z.object({
  id: z.number(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.enum(['libre', 'reserve', 'bloque']),
  place: z.object({ name: z.string() }),
  priest_id: z.string(),
  priest_name: z.string(),
});
export type GlanceSlot = z.infer<typeof slotSchema>;

export const getConfessionPlanning = async (nodeId: string, dateFrom: string): Promise<GlanceSlot[]> =>
  z.array(slotSchema).parse(await api.get('/staff/confessions/planning/', { params: { node: nodeId, date_from: dateFrom } }));

export const confessionGlanceQueryOptions = (nodeId: string, dateFrom = dayjs().format('YYYY-MM-DD')) =>
  queryOptions({ queryKey: ['dashboards', 'nodes', nodeId, 'confessions', dateFrom], queryFn: () => getConfessionPlanning(nodeId, dateFrom) });

/** Réservé à `confessions.gerer` ou `confessions.voir_planning`. */
export const useConfessionGlance = (nodeId: string, enabled: boolean) => useQuery({ ...confessionGlanceQueryOptions(nodeId), enabled });
