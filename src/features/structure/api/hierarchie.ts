import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Hiérarchie V1 (remplace l'ancien `org` : provinces, diocèses, paroisses,
// églises) : nœuds typés, lieux de culte, horaires, offices et nominations.
// Contrat : backend apps/hierarchy/serializers.py. Lecture ouverte ; écriture
// soumise à une capacité sur le nœud (structure.gerer, horaires.gerer,
// offices.nommer).

// --- Nœuds -----------------------------------------------------------------------

export const noeudSchema = z.object({
  id: z.string(),
  type: z.object({ code: z.string(), label: z.string() }),
  name: z.string(),
  code: z.string().default(''),
  status: z.string(),
  address: z.string().default(''),
  city: z.string().default(''),
  erected_at: z.string().nullable().optional(),
  is_active_on_platform: z.boolean(),
  depth: z.number(),
  parent_id: z.string().nullable(),
  has_children: z.boolean(),
});
export type Noeud = z.infer<typeof noeudSchema>;

export const LIBELLES_STATUT_NOEUD: Record<string, string> = {
  en_fondation: 'En fondation',
  erige: 'Érigé',
  supprime: 'Supprimé',
};

export const useNoeud = (id: string | null | undefined) =>
  useQuery({
    queryKey: ['hierarchy', 'node', id],
    queryFn: async () =>
      noeudSchema.parse(
        await api.get<unknown>(`/v1/hierarchy/nodes/${id}/`, { quiet: true }),
      ),
    enabled: !!id,
  });

/** Enfants directs (liste simple, non paginée). */
export const useEnfants = (id: string | null | undefined) =>
  useQuery({
    queryKey: ['hierarchy', 'children', id],
    queryFn: async () =>
      z
        .array(noeudSchema)
        .parse(
          await api.get<unknown>(`/v1/hierarchy/nodes/${id}/children/`, {
            quiet: true,
          }),
        ),
    enabled: !!id,
  });

export const useAncetres = (id: string | null | undefined) =>
  useQuery({
    queryKey: ['hierarchy', 'ancestors', id],
    queryFn: async () =>
      z
        .array(noeudSchema)
        .parse(
          await api.get<unknown>(`/v1/hierarchy/nodes/${id}/ancestors/`, {
            quiet: true,
          }),
        ),
    enabled: !!id,
  });

/** `GET /v1/hierarchy/nodes/?type=&q=` (paginé) : racines pour la plateforme. */
export const useNoeuds = (
  filtres: { type?: string; q?: string; within?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: ['hierarchy', 'nodes', filtres],
    queryFn: async () =>
      z
        .object({ count: z.number(), results: z.array(noeudSchema) })
        .parse(
          await api.get<unknown>('/v1/hierarchy/nodes/', {
            params: {
              type: filtres.type || undefined,
              q: filtres.q?.trim() || undefined,
              within: filtres.within || undefined,
              limit: 50,
            },
            quiet: true,
          }),
        ),
    placeholderData: keepPreviousData,
    enabled,
  });

export const typeNoeudSchema = z.object({
  code: z.string(),
  label: z.string(),
  is_territorial: z.boolean(),
  holds_registers: z.boolean(),
  order: z.number(),
  allowed_parent_types: z.array(z.string()),
});
export type TypeNoeud = z.infer<typeof typeNoeudSchema>;

export const useTypesNoeud = () =>
  useQuery({
    queryKey: ['hierarchy', 'node-types'],
    queryFn: async () =>
      z
        .array(typeNoeudSchema)
        .parse(await api.get<unknown>('/v1/hierarchy/node-types/')),
    staleTime: 60 * 60 * 1000,
  });

export type NoeudInput = {
  type: string;
  name: string;
  parent_id: string;
  code?: string;
  city?: string;
  status?: string;
};

export const useCreerNoeud = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: NoeudInput) =>
      noeudSchema.parse(await api.post<unknown>('/v1/hierarchy/nodes/', data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hierarchy'] }),
  });
};

export const useModifierNoeud = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      code?: string;
      city?: string;
      status?: string;
      is_active_on_platform?: boolean;
    }) =>
      noeudSchema.parse(
        await api.patch<unknown>(`/v1/hierarchy/nodes/${id}/`, data),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hierarchy'] }),
  });
};

// --- Offices et nominations ---------------------------------------------------------

export const typeOfficeSchema = z.object({
  code: z.string(),
  label: z.string(),
  node_types: z.array(z.string()),
  required_order: z.string(),
  cardinality: z.string(),
  appointed_by: z.array(z.string()),
  appointed_by_platform: z.boolean(),
  capabilities: z.array(z.string()),
  inherits_down: z.boolean(),
  qualities: z
    .array(z.object({ code: z.string(), label: z.string() }))
    .default([]),
});
export type TypeOffice = z.infer<typeof typeOfficeSchema>;

export const useTypesOffice = () =>
  useQuery({
    queryKey: ['hierarchy', 'office-types'],
    queryFn: async () =>
      z
        .array(typeOfficeSchema)
        .parse(await api.get<unknown>('/v1/hierarchy/office-types/')),
    staleTime: 60 * 60 * 1000,
  });

const noeudRef = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.string(),
});

export const nominationSchema = z.object({
  id: z.number(),
  person: z.object({ id: z.string(), email: z.string(), full_name: z.string() }),
  office: z.string(),
  office_label: z.string(),
  quality: z.string().default(''),
  node: noeudRef,
  start_date: z.string(),
  end_date: z.string().nullable(),
  status: z.string(),
  decree_ref: z.string().default(''),
  note: z.string().default(''),
  created_at: z.string(),
});
export type Nomination = z.infer<typeof nominationSchema>;

export const LIBELLES_STATUT_NOMINATION: Record<string, string> = {
  proposee: 'Proposée',
  active: 'Active',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

export const NOMINATIONS_PAR_PAGE = 50;

export const useNominations = (
  f: { node?: string; status?: string; offset?: number },
  enabled = true,
) =>
  useQuery({
    queryKey: ['hierarchy', 'assignments', f],
    queryFn: async () =>
      z
        .object({ count: z.number(), results: z.array(nominationSchema) })
        .parse(
          await api.get<unknown>('/v1/hierarchy/assignments/', {
            params: {
              node: f.node,
              status: f.status || undefined,
              limit: NOMINATIONS_PAR_PAGE,
              offset: f.offset ?? 0,
            },
            quiet: true,
          }),
        ),
    placeholderData: keepPreviousData,
    enabled,
  });

export const personneSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email_masked: z.string(),
  etat_de_vie: z.string(),
  degre_ordre: z.string(),
  statut_verification: z.string(),
});
export type Personne = z.infer<typeof personneSchema>;

/** `GET /v1/hierarchy/persons/?q=` (offices.nommer, 2 caractères au moins). */
export const usePersonnes = (q: string) =>
  useQuery({
    queryKey: ['hierarchy', 'persons', q],
    queryFn: async () =>
      z
        .object({ results: z.array(personneSchema) })
        .parse(
          await api.get<unknown>('/v1/hierarchy/persons/', {
            params: { q, limit: 10 },
            quiet: true,
          }),
        ).results,
    enabled: q.trim().length >= 2,
  });

export type NominationInput = {
  person_id: string;
  office: string;
  node_id: string;
  start_date?: string;
  decree_ref?: string;
  note?: string;
  quality?: string;
};

export const useNommer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: NominationInput) =>
      nominationSchema.parse(
        await api.post<unknown>('/v1/hierarchy/assignments/', data),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hierarchy', 'assignments'] }),
  });
};

/** Terminer ou annuler une nomination (`PATCH …/assignments/{id}/`). */
export const useFinNomination = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: number;
      action: 'terminer' | 'annuler';
    }) =>
      nominationSchema.parse(
        await api.patch<unknown>(`/v1/hierarchy/assignments/${id}/`, {
          action,
        }),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hierarchy', 'assignments'] }),
  });
};
