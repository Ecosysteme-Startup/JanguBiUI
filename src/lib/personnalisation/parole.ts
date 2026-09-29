import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Personnalisation de la Parole (backend `docs/API-PAROLE-POUR-VOUS.md` §2,
// §4) : partagée entre la page Parole (« Pourquoi ? ») et le profil.

const reglagesParoleSchema = z.object({
  personnalisation_parole: z.boolean(),
});
export type ReglagesParole = z.infer<typeof reglagesParoleSchema>;

export const REGLAGES_PAROLE_KEY = ['bible', 'reglages'];
/** Clé react-query de « Pour vous aujourd'hui » (invalidée par ces réglages). */
export const POUR_VOUS_KEY = ['bible', 'pour-vous'];

export const getReglagesParole = (): Promise<ReglagesParole> =>
  api
    .get<unknown>('/v1/bible/reglages/')
    .then((d) => reglagesParoleSchema.parse(d));

export const useReglagesParole = () =>
  useQuery(
    queryOptions({
      queryKey: REGLAGES_PAROLE_KEY,
      queryFn: getReglagesParole,
      retry: false,
    }),
  );

export const useModifierReglagesParole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (personnalisation_parole: boolean) =>
      api
        .put<unknown>('/v1/bible/reglages/', { personnalisation_parole })
        .then((d) => reglagesParoleSchema.parse(d)),
    onSuccess: (data) => {
      queryClient.setQueryData(REGLAGES_PAROLE_KEY, data);
      void queryClient.invalidateQueries({ queryKey: POUR_VOUS_KEY });
    },
  });
};

/**
 * `DELETE bible/evenements/` : efface l'historique de lecture et les
 * recommandations qui en découlent. Les signets et surlignages restent.
 */
export const useEffacerHistoriqueLecture = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<null>('/v1/bible/evenements/'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POUR_VOUS_KEY }),
  });
};
