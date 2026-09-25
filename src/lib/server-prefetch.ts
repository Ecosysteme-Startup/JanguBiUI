import { dehydrate, type DehydratedState, type FetchQueryOptions, QueryClient } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQueryOptions = FetchQueryOptions<any, any, any, any>;

/**
 * Rendu serveur des pages publiques (SEO) : précharge les requêtes publiques puis
 * sérialise le cache pour `<HydrationBoundary>`. Aucun jeton côté serveur ; une requête
 * en échec n'est pas transmise et le client la rejoue.
 */
export const prefetchPublic = async (...options: AnyQueryOptions[]): Promise<DehydratedState> => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });
  await Promise.all(options.map((o) => queryClient.prefetchQuery(o)));
  return dehydrate(queryClient);
};
