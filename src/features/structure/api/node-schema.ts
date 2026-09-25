import { z } from 'zod';

import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

/** Nœud de l'arbre (NodeOutputSerializer). */
export const nodeSchema = z.object({
  id: z.string(),
  type: z.object({ code: z.string(), label: z.string() }),
  name: z.string(),
  code: z.string(),
  status: z.enum(['en_fondation', 'erige', 'supprime']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  lat: z.string().nullable().optional(),
  lng: z.string().nullable().optional(),
  erected_at: z.string().nullable().optional(),
  is_active_on_platform: z.boolean().optional(),
  located_in_id: z.string().nullable(),
  depth: z.number(),
  parent_id: z.string().nullable(),
  has_children: z.boolean(),
});
export type StructureNode = z.infer<typeof nodeSchema>;

type _NodeMatchesContract = Expect<Matches<StructureNode, ResponseBody<'v1_hierarchy_nodes_retrieve'>>>;

export const NODE_STATUS_LABEL: Record<string, string> = {
  en_fondation: 'En fondation',
  erige: 'Érigé',
  supprime: 'Supprimé',
};

export const structureKeys = {
  all: ['structure'] as const,
  node: (id: string) => ['structure', 'node', id] as const,
  children: (id: string) => ['structure', 'children', id] as const,
  search: (within: string, q: string, type: string) => ['structure', 'search', within, q, type] as const,
  places: (id: string) => ['structure', 'places', id] as const,
  holders: (id: string) => ['structure', 'holders', id] as const,
};
