import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Suggestions d'écoute de la sonothèque (backend `docs/API-AUDIO.md` §7) :
// désactiver efface tout de suite les recommandations calculées.

const reglagesEcouteSchema = z.object({
  recommendations_enabled: z.boolean(),
});
export type ReglagesEcoute = z.infer<typeof reglagesEcouteSchema>;

const cle = ['audio', 'reglages'];

export const getReglagesEcoute = (): Promise<ReglagesEcoute> =>
  api
    .get<unknown>('/audio/reglages/')
    .then((d) => reglagesEcouteSchema.parse(d));

export const useReglagesEcoute = () =>
  useQuery(
    queryOptions({
      queryKey: cle,
      queryFn: getReglagesEcoute,
      retry: false,
    }),
  );

export const useModifierReglagesEcoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recommendations_enabled: boolean) =>
      api
        .put<unknown>('/audio/reglages/', { recommendations_enabled })
        .then((d) => reglagesEcouteSchema.parse(d)),
    onSuccess: (data) => {
      queryClient.setQueryData(cle, data);
      void queryClient.invalidateQueries({ queryKey: ['audio', 'pour-vous'] });
    },
  });
};
