import { queryOptions, useQuery } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api-client';

import { type DirectoryNode, directoryNodeSchema } from './get-directory';

/** Résout le code d'URL (`/paroisses/DAK-SAINT-DOMINIQUE`) en nœud. `null` : paroisse inconnue (404). */
export const getParishByCode = async (code: string): Promise<DirectoryNode | null> => {
  const wanted = code.trim();
  if (!wanted) return null;
  try {
    return directoryNodeSchema.parse(await api.get(`/public/nodes/by-code/${encodeURIComponent(wanted)}/`));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

export const parishByCodeQueryOptions = (code: string) =>
  queryOptions({ queryKey: ['public', 'parish', code], queryFn: () => getParishByCode(code), staleTime: 5 * 60 * 1000 });

export const useParishByCode = (code: string) => useQuery(parishByCodeQueryOptions(code));
