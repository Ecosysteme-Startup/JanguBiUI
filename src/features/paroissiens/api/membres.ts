import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Paroissiens d'une paroisse (backend `docs/API-AUDIO.md` §9) : capacité
// `paroissiens.gerer` (curé, curé in solidum, secrétaire paroissial ; MFA).
// Donnée nominative : jamais de classement, ordre alphabétique du serveur.

export const membreSchema = z.object({
  user_id: z.string(),
  first_name: z.string().default(''),
  last_name: z.string().default(''),
  principale: z.boolean(),
  membre_depuis: z.string().nullish(),
  retire_le: z.string().nullish(),
});
export type Membre = z.infer<typeof membreSchema>;

const pageSchema = z.object({
  count: z.number(),
  next: z.string().nullish(),
  previous: z.string().nullish(),
  results: z.array(membreSchema),
});
export type PageMembres = z.infer<typeof pageSchema>;

export const MEMBRES_PAR_PAGE = 50;

export type FiltresMembres = {
  paroisseId: string;
  q: string;
  retires: boolean;
  offset: number;
};

const cle = (f: Partial<FiltresMembres>) =>
  ['paroissiens', f.paroisseId, f.retires, f.q, f.offset] as const;

/** `GET /hierarchy/nodes/<paroisse>/membres/?q=&retires=&limit=&offset=`. */
export const getMembres = async ({
  paroisseId,
  q,
  retires,
  offset,
}: FiltresMembres): Promise<PageMembres> =>
  pageSchema.parse(
    await api.get<unknown>(
      `/v1/hierarchy/nodes/${encodeURIComponent(paroisseId)}/membres/`,
      {
        params: {
          q: q.trim() || undefined,
          retires,
          limit: MEMBRES_PAR_PAGE,
          offset,
        },
        quiet: true,
      },
    ),
  );

export const useMembres = (f: FiltresMembres) =>
  useQuery({
    queryKey: cle(f),
    queryFn: () => getMembres(f),
    enabled: !!f.paroisseId,
    placeholderData: keepPreviousData,
    retry: false,
  });

/** `DELETE …/membres/<user>/` : retrait (journalisé). */
export const useRetirerMembre = (paroisseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<unknown>(
        `/v1/hierarchy/nodes/${encodeURIComponent(paroisseId)}/membres/${encodeURIComponent(userId)}/`,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['paroissiens', paroisseId],
      }),
  });
};

/** `POST …/membres/<user>/retablir/`. */
export const useRetablirMembre = (paroisseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<unknown>(
        `/v1/hierarchy/nodes/${encodeURIComponent(paroisseId)}/membres/${encodeURIComponent(userId)}/retablir/`,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['paroissiens', paroisseId],
      }),
  });
};
