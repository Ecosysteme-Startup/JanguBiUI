import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Paroisses multiples (décisions 6-8, backend `docs/API-AUDIO.md` §9) :
// une paroisse principale (accueil, annonces avec notifications, horaires,
// dons proposés) et des paroisses secondaires. Principale ou secondaire,
// l'appartenance ouvre les contenus « réservés aux paroissiens ». Adhésion
// libre ; la paroisse peut retirer un membre (`paroissiens.gerer`).
//
// Partagé (lib) : le profil, la sonothèque, le lecteur et les annonces s'en
// servent.

export const paroisseRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type ParoisseRef = z.infer<typeof paroisseRefSchema>;

export const maParoisseSchema = z.object({
  paroisse: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string().nullish(),
    type: z.string().nullish(),
    // Champs d'affichage facultatifs (hors contrat) : quartier, doyenné.
    city: z.string().nullish(),
    deanery_name: z.string().nullish(),
  }),
  principale: z.boolean(),
  membre_depuis: z.string().nullish(),
});
export type MaParoisse = z.infer<typeof maParoisseSchema>;

const mesParoissesSchema = z.array(maParoisseSchema);

export const mesParoissesKey = ['me', 'paroisses'] as const;

/** `GET /me/paroisses/` : la principale d'abord. */
export const getMesParoisses = async (): Promise<MaParoisse[]> =>
  mesParoissesSchema.parse(await api.get<unknown>('/v1/me/paroisses/'));

export const getMesParoissesQueryOptions = () =>
  queryOptions({
    queryKey: mesParoissesKey,
    queryFn: getMesParoisses,
    staleTime: 60_000,
  });

export const useMesParoisses = ({ enabled = true } = {}) =>
  useQuery({ ...getMesParoissesQueryOptions(), enabled });

/**
 * Après un changement d'appartenance, ce qui en dépend est relu : la liste,
 * le profil (`paroisse_suivie`), la sonothèque (albums verrouillés) et les
 * annonces (fil des autres paroisses).
 */
const invalider = (
  queryClient: ReturnType<typeof useQueryClient>,
  data?: MaParoisse[],
) => {
  if (data) queryClient.setQueryData(mesParoissesKey, data);
  else void queryClient.invalidateQueries({ queryKey: mesParoissesKey });
  void queryClient.invalidateQueries({ queryKey: ['user'] });
  void queryClient.invalidateQueries({ queryKey: ['sonotheque'] });
  void queryClient.invalidateQueries({ queryKey: ['articles'] });
};

export type AjouterParoisseInput = {
  paroisseId: string;
  principale?: boolean;
};

/** `POST /me/paroisses/` (idempotent ; la première est principale). */
export const ajouterParoisse = async ({
  paroisseId,
  principale = false,
}: AjouterParoisseInput): Promise<MaParoisse[]> =>
  mesParoissesSchema.parse(
    await api.post<unknown>(
      '/v1/me/paroisses/',
      { paroisse_id: paroisseId, principale },
      { quiet: true },
    ),
  );

export const useAjouterParoisse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ajouterParoisse,
    onSuccess: (data) => invalider(queryClient, data),
  });
};

/** `DELETE /me/paroisses/<id>/` : la plus ancienne secondaire devient principale. */
export const useQuitterParoisse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paroisseId: string) =>
      api.delete<unknown>(
        `/v1/me/paroisses/${encodeURIComponent(paroisseId)}/`,
        { quiet: true },
      ),
    onSuccess: () => invalider(queryClient),
  });
};

/** `PUT /me/paroisses/<id>/principale/`. */
export const useDefinirPrincipale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paroisseId: string) =>
      mesParoissesSchema.parse(
        await api.put<unknown>(
          `/v1/me/paroisses/${encodeURIComponent(paroisseId)}/principale/`,
          undefined,
          { quiet: true },
        ),
      ),
    onSuccess: (data) => invalider(queryClient, data),
  });
};

// --------------------------------------------------------------- annuaire

export const paroisseAnnuaireSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullish(),
  parent_name: z.string().nullish(),
  deanery_name: z.string().nullish(),
  diocese_name: z.string().nullish(),
});
export type ParoisseAnnuaire = z.infer<typeof paroisseAnnuaireSchema>;

const annuaireSchema = z.object({
  count: z.number().optional(),
  results: z.array(paroisseAnnuaireSchema),
});

/** Annuaire public des paroisses : `GET /public/nodes/?q=` (type paroisse). */
export const rechercherParoisses = async (
  q: string,
): Promise<ParoisseAnnuaire[]> =>
  annuaireSchema.parse(
    await api.get<unknown>('/v1/public/nodes/', {
      params: { q, type: 'paroisse', limit: 10 },
      quiet: true,
    }),
  ).results;

export const useRechercheParoisses = (q: string) => {
  const terme = q.trim();
  return useQuery({
    queryKey: ['annuaire', 'paroisses', terme],
    queryFn: () => rechercherParoisses(terme),
    enabled: terme.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
};

// --------------------------------------------------------------- libellés

/** « le 3 septembre 2026 ». */
export const formatDateAdhesion = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Dakar',
  });
};

/** Code d'erreur métier d'une adhésion refusée → message sobre. */
export const messageAdhesion = (code: string | null | undefined): string => {
  if (code === 'retire_par_la_paroisse')
    return 'Cette paroisse vous a retiré de ses membres. Rapprochez-vous de son secrétariat pour revenir.';
  if (code === 'not_a_parish')
    return 'Ce lieu n’est pas une paroisse : il ne peut pas être ajouté.';
  if (code === 'membre_introuvable')
    return 'Vous n’êtes plus membre de cette paroisse.';
  return 'L’opération n’a pas pu aboutir. Réessayez dans quelques instants.';
};
