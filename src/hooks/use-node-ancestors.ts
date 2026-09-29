import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const nodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.object({ code: z.string(), label: z.string() }).optional(),
});
export type AncestorNode = z.infer<typeof nodeSchema>;

/** Ancêtres d'un nœud, DE LA RACINE AU PARENT (`node_ancestors`, tri par profondeur). */
export const getNodeAncestors = async (nodeId: string) =>
  z.array(nodeSchema).parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/ancestors/`));

export const nodeAncestorsQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['hierarchy', 'nodes', nodeId, 'ancestors'], queryFn: () => getNodeAncestors(nodeId), staleTime: 30 * 60 * 1000 });

/** Le diocèse de la chaîne (par type), à défaut le parent immédiat. */
export const dioceseOf = (ancestors: AncestorNode[] | undefined): AncestorNode | undefined =>
  ancestors?.findLast((a) => a.type?.code === 'diocese') ?? ancestors?.at(-1);

/**
 * Rattachement lisible d'un nœud : le parent IMMÉDIAT, suivi du diocèse quand le parent n'en
 * est pas un (« Doyenné Plateau-Médina · Archidiocèse de Dakar »). Une paroisse rattachée
 * directement à son diocèse affiche le seul diocèse : c'est le cas du pilote Saint-Dominique,
 * dont le doyenné reste à confirmer par la chancellerie (`apps/hierarchy/profiles.py`).
 */
export const jurisdictionLabel = (ancestors: AncestorNode[] | undefined): string | undefined => {
  const parent = ancestors?.at(-1);
  if (!parent) return undefined;
  const diocese = ancestors?.findLast((a) => a.type?.code === 'diocese');
  return diocese && diocese.id !== parent.id ? `${parent.name} · ${diocese.name}` : parent.name;
};

/** Rattachement d'un nœud pour le sélecteur de contexte (parent immédiat, puis diocèse). Lecture publique. */
export const useNodeParentName = (nodeId: string | null): string | undefined => {
  const { data } = useQuery({ ...nodeAncestorsQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
  return jurisdictionLabel(data);
};
