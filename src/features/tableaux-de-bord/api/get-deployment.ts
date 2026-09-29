import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/**
 * Déploiement de Jàngu Bi dans un sous-arbre : paroisses (actives ou non) regroupées
 * par doyenné. Données de structure publiques (noms de juridictions), aucune personne.
 */
const nodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  parent_id: z.string().nullable(),
  status: z.string().optional(),
  is_active_on_platform: z.boolean().default(false),
});
const pageSchema = z.object({ count: z.number(), results: z.array(nodeSchema) });
type NodeLite = z.infer<typeof nodeSchema>;

const PAGE = 50;
const MAX_PAGES = 20;

const listAll = async (params: Record<string, string>): Promise<NodeLite[]> => {
  const first = pageSchema.parse(await api.get('/hierarchy/nodes/', { params: { ...params, limit: PAGE, offset: 0 } }));
  const pages = Math.min(Math.ceil(first.count / PAGE), MAX_PAGES);
  // Pages suivantes en parallèle (pas de cascade, ENF-F03).
  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, i) =>
      api.get('/hierarchy/nodes/', { params: { ...params, limit: PAGE, offset: (i + 1) * PAGE } }).then((p) => pageSchema.parse(p).results),
    ),
  );
  return [...first.results, ...rest.flat()];
};

export type DeploymentRow = { id: string; name: string; total: number; active: number; founding: number };
/** Paroisse du sous-arbre : nom de juridiction et état d'ouverture, jamais une personne. */
export type DeploymentParish = { id: string; name: string; doyenne: string | null; active: boolean; founding: boolean };
export type Deployment = { total: number; active: number; founding: number; rows: DeploymentRow[]; parishes: DeploymentParish[] };

export const summarize = (parishes: NodeLite[], doyennes: NodeLite[]): Deployment => {
  const rows = doyennes.map((d) => {
    const own = parishes.filter((p) => p.parent_id === d.id);
    return {
      id: d.id,
      name: d.name,
      total: own.length,
      active: own.filter((p) => p.is_active_on_platform).length,
      founding: own.filter((p) => p.status === 'en_fondation').length,
    };
  });
  const doyenneName = new Map(doyennes.map((d) => [d.id, d.name]));
  return {
    total: parishes.length,
    active: parishes.filter((p) => p.is_active_on_platform).length,
    founding: parishes.filter((p) => p.status === 'en_fondation').length,
    rows,
    parishes: parishes.map((p) => ({
      id: p.id,
      name: p.name,
      doyenne: (p.parent_id && doyenneName.get(p.parent_id)) || null,
      active: p.is_active_on_platform,
      founding: p.status === 'en_fondation',
    })),
  };
};

export const getDeployment = async (nodeId: string): Promise<Deployment> => {
  const [parishes, doyennes] = await Promise.all([
    listAll({ within: nodeId, type: 'paroisse' }),
    listAll({ within: nodeId, type: 'doyenne' }),
  ]);
  return summarize(parishes, doyennes);
};

export const deploymentQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['dashboards', 'deployment', nodeId], queryFn: () => getDeployment(nodeId), staleTime: 10 * 60 * 1000 });

export const useDeployment = (nodeId: string) => useQuery(deploymentQueryOptions(nodeId));
