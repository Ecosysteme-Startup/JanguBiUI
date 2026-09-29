import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/**
 * Feuille d'annonces du prochain dimanche (GET /staff/news/sunday-sheet/), pour l'encart du
 * tableau de bord. Doublon assumé de la feature annonces-edition : titres et statuts seulement.
 */
const sheetSchema = z.object({
  node_id: z.string(),
  sunday: z.string(),
  items: z.array(z.object({ id: z.string(), title: z.string(), status: z.string() })),
});
export type SundaySheetGlance = z.infer<typeof sheetSchema>;

export const getSundaySheetGlance = async (nodeId: string): Promise<SundaySheetGlance> =>
  sheetSchema.parse(await api.get('/staff/news/sunday-sheet/', { params: { node: nodeId } }));

export const sundaySheetGlanceQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['dashboards', 'nodes', nodeId, 'feuille-du-dimanche'], queryFn: () => getSundaySheetGlance(nodeId) });

/** Réservé à `annonces.publier`. */
export const useSundaySheetGlance = (nodeId: string, enabled: boolean) => useQuery({ ...sundaySheetGlanceQueryOptions(nodeId), enabled });
