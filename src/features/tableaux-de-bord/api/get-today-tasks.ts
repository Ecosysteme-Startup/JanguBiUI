import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

/**
 * Tâches du jour de la paroisse (GET /staff/taches-du-jour/?node=), pour « Reste à faire
 * aujourd'hui ». Le serveur ne renvoie que les rubriques permises par les capacités de
 * l'appelant ; seules les rubriques absentes du tableau de bord du nœud sont lues ici
 * (quêtes à confirmer, intentions à planifier, intentions du jour). Jamais le nom d'un pénitent.
 */
const todayTasksSchema = z.object({
  node: z.object({ id: z.string(), name: z.string() }),
  date: z.string(),
  tasks: z.array(z.object({ code: z.string(), label: z.string(), count: z.number() })),
  confessions: z
    .array(
      z.object({
        slot_id: z.number(),
        starts_at: z.string(),
        ends_at: z.string(),
        place_name: z.string(),
        priest_name: z.string(),
        reserved: z.boolean(),
      }),
    )
    .nullable(),
});
export type TodayTasks = z.infer<typeof todayTasksSchema>;
type _TodayTasksMatchesContract = Expect<Matches<TodayTasks, ResponseBody<'staff_taches_du_jour'>>>;

/** Codes de rubrique repris par le tableau de bord (les autres viennent de /dashboards/nodes/). */
export const TODAY_TASK_CODES = {
  quetes: 'quetes_a_confirmer',
  intentionsAPlanifier: 'intentions_a_planifier',
  intentionsDuJour: 'intentions_du_jour',
} as const;

export const getTodayTasks = async (nodeId: string): Promise<TodayTasks> =>
  todayTasksSchema.parse(await api.get('/staff/taches-du-jour/', { params: { node: nodeId } }));

export const todayTasksQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['dashboards', 'nodes', nodeId, 'taches-du-jour'], queryFn: () => getTodayTasks(nodeId), staleTime: 60_000 });

/** Réservé aux capacités d'au moins une rubrique lue (`dons.saisir_quete`, `dons.gerer_fonds`, `intentions.gerer`). */
export const useTodayTasks = (nodeId: string, enabled: boolean) => useQuery({ ...todayTasksQueryOptions(nodeId), enabled });

/** Nombre d'une rubrique (0 si le serveur ne l'a pas renvoyée). */
export const taskCount = (data: TodayTasks | undefined, code: string) => data?.tasks.find((t) => t.code === code)?.count ?? 0;
