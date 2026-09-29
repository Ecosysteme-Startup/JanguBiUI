import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Réglage « montrer ma présence » (backend `docs/TEMPS-REEL.md` §2.4).
// `montrer_presence` : choix explicite, ou `null` pour le défaut (activé pour
// le clergé et le staff, désactivé pour les fidèles) ; `effective` : ce qui
// s'applique réellement.

const reglagePresenceSchema = z.object({
  montrer_presence: z.boolean().nullable(),
  effective: z.boolean(),
  default: z.boolean(),
});
export type ReglagePresence = z.infer<typeof reglagePresenceSchema>;

const cle = ['me', 'presence'];

export const getReglagePresence = (): Promise<ReglagePresence> =>
  api
    .get<unknown>('/v1/me/presence/')
    .then((d) => reglagePresenceSchema.parse(d));

export const useReglagePresence = (enabled = true) =>
  useQuery(
    queryOptions({
      queryKey: cle,
      queryFn: getReglagePresence,
      enabled,
      retry: false,
    }),
  );

export const useModifierReglagePresence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (montrer_presence: boolean | null) =>
      api
        .put<unknown>('/v1/me/presence/', { montrer_presence })
        .then((d) => reglagePresenceSchema.parse(d)),
    onSuccess: (data) => queryClient.setQueryData(cle, data),
  });
};
