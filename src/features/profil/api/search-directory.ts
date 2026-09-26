import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const nodeSchema = z.object({ id: z.string(), name: z.string(), city: z.string().nullable().optional() });
export type DirectoryNode = z.infer<typeof nodeSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(nodeSchema) });

/** Type de nœud cherché dans l'annuaire public : diocèse d'incardination ou institut. */
export type DirectoryType = 'diocese' | 'institut';

export const searchDirectory = async (type: DirectoryType, q: string, signal?: AbortSignal) =>
  pageSchema.parse(await api.get('/public/nodes/', { params: { q, type, limit: 8 }, signal }));

export const useSearchDirectory = (type: DirectoryType, q: string) =>
  useQuery(
    queryOptions({
      queryKey: ['public', 'nodes', type, q],
      queryFn: ({ signal }) => searchDirectory(type, q, signal),
      enabled: q.trim().length >= 2,
      placeholderData: keepPreviousData,
    }),
  );
