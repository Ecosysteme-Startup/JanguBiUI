import { queryOptions, useQuery } from '@tanstack/react-query';

import { type DirectoryNode, getDirectory } from './get-directory';

/**
 * Résout le code d'URL (`/paroisses/DAK-SAINT-DOMINIQUE`) en nœud. L'API n'expose pas de
 * recherche exacte par code : on interroge l'annuaire (`q` couvre le code) puis on garde
 * la correspondance exacte, insensible à la casse. `null` : paroisse inconnue.
 */
export const getParishByCode = async (code: string): Promise<DirectoryNode | null> => {
  const wanted = code.trim().toLowerCase();
  if (!wanted) return null;
  const page = await getDirectory({ q: code.trim(), limit: 50 });
  return page.results.find((node) => node.code.toLowerCase() === wanted) ?? null;
};

export const parishByCodeQueryOptions = (code: string) =>
  queryOptions({ queryKey: ['public', 'parish', code], queryFn: () => getParishByCode(code), staleTime: 5 * 60 * 1000 });

export const useParishByCode = (code: string) => useQuery(parishByCodeQueryOptions(code));
