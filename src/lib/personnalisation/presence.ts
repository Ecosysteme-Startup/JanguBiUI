import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { useRealtimeStore } from '@/stores/realtime-store';

// Réglage « montrer ma présence » (backend `docs/TEMPS-REEL.md` §2.4).
// `montrer_presence` : choix explicite, ou `null` pour le défaut (activé pour
// le clergé et le staff, désactivé pour les fidèles) ; `effective` : ce qui
// s'applique réellement.
//
// Réciprocité (décision 2, TEMPS-REEL §2.1) : qui masque EXPLICITEMENT sa
// présence (`montrer_presence === false`) ne voit plus celle des autres. Un
// fidèle resté au réglage par défaut voit toujours celle de ses prêtres.

const reglagePresenceSchema = z.object({
  montrer_presence: z.boolean().nullable(),
  effective: z.boolean(),
  default: z.boolean(),
});
export type ReglagePresence = z.infer<typeof reglagePresenceSchema>;

const cle = ['me', 'presence'];

export const getReglagePresence = (): Promise<ReglagePresence> =>
  api.get<unknown>('/me/presence/').then((d) => reglagePresenceSchema.parse(d));

export const useReglagePresence = (enabled = true) =>
  useQuery(
    queryOptions({
      queryKey: cle,
      queryFn: getReglagePresence,
      enabled,
      retry: false,
    }),
  );

/** Masquage explicite : la présence des autres n'est plus affichée. */
export const presenceMasqueeExplicitement = (
  reglage: ReglagePresence | undefined,
) => reglage?.montrer_presence === false;

export const useModifierReglagePresence = () => {
  const queryClient = useQueryClient();
  const clearPresences = useRealtimeStore((s) => s.clearPresences);
  return useMutation({
    mutationFn: (montrer_presence: boolean | null) =>
      api
        .put<unknown>('/me/presence/', { montrer_presence })
        .then((d) => reglagePresenceSchema.parse(d)),
    onSuccess: (data) => {
      queryClient.setQueryData(cle, data);
      // Le serveur ne renvoie pas l'état des interlocuteurs : on efface
      // (masquage) ou on recharge (activation) les indicateurs.
      if (presenceMasqueeExplicitement(data)) clearPresences();
      else
        void queryClient.invalidateQueries({
          queryKey: ['messaging', 'presence'],
        });
    },
  });
};
