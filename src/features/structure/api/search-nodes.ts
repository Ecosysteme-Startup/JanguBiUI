import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { nodeSchema, structureKeys } from './node-schema';

const pageSchema = z.object({ count: z.number(), results: z.array(nodeSchema) });

export const SEARCH_LIMIT = 50;

/** Filtre de l'arbre : descendants du nœud par nom/code/ville et type. */
export const searchNodes = async (within: string, q: string, type: string) =>
  pageSchema.parse(await api.get('/hierarchy/nodes/', { params: { within, q, type, limit: SEARCH_LIMIT } }));

export const useSearchNodes = (within: string, q: string, type: string) =>
  useQuery({
    queryKey: structureKeys.search(within, q, type),
    queryFn: () => searchNodes(within, q, type),
    enabled: Boolean(q.trim() || type),
    placeholderData: keepPreviousData,
  });
