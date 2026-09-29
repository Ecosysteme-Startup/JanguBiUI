import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Annonces et articles côté staff : `/v1/staff/news/` (capacité
// `annonces.publier`). Contrat : backend apps/news/serializers.py
// (StaffArticleOutputSerializer, ArticleCreate/Update/Publish/Unpublish).

export const TYPES_CONTENU = ['announcement', 'article', 'meditation'] as const;
export type TypeContenu = (typeof TYPES_CONTENU)[number];

export const LIBELLES_TYPE: Record<string, string> = {
  announcement: 'Annonce',
  article: 'Article',
  meditation: 'Méditation du jour',
  pastoral_letter: 'Lettre pastorale',
};

export const LIBELLES_STATUT_CONTENU: Record<string, string> = {
  draft: 'Brouillon',
  scheduled: 'Programmé',
  published: 'Publié',
  unpublished: 'Dépublié',
};

export const categorieSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().optional(),
});
export type Categorie = z.infer<typeof categorieSchema>;

export const contenuStaffSchema = z.object({
  id: z.string(),
  content_type: z.string(),
  title: z.string(),
  excerpt: z.string().default(''),
  content: z.string().default(''),
  content_format: z.string().default('text'),
  category: categorieSchema.nullable(),
  author_name: z.string().nullish(),
  scope: z
    .object({
      node_id: z.string().nullable(),
      node_name: z.string().nullable(),
      place_id: z.number().nullable(),
      place_name: z.string().nullable(),
    })
    .nullable(),
  is_sunday_notice: z.boolean().default(false),
  sunday_date: z.string().nullable().optional(),
  status: z.string(),
  publish_at: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  unpublished_at: z.string().nullable().optional(),
  unpublish_reason: z.string().nullish(),
  notify_followers: z.boolean().optional(),
  reads_count: z.number().default(0),
  // Épinglage (API-V1-COMPLEMENTS §2.1) : vrai tant que la date de fin n'est pas passée.
  is_pinned: z.boolean().default(false),
  pinned_until: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ContenuStaff = z.infer<typeof contenuStaffSchema>;

const pageSchema = z.object({
  count: z.number(),
  next: z.string().nullish(),
  previous: z.string().nullish(),
  results: z.array(contenuStaffSchema),
});

export const CONTENUS_PAR_PAGE = 20;

export type FiltresContenus = {
  node?: string;
  status?: string;
  type?: string;
  q?: string;
  offset?: number;
};

const params = (f: FiltresContenus) => ({
  node: f.node || undefined,
  status: f.status || undefined,
  type: f.type || undefined,
  q: f.q?.trim() || undefined,
  limit: CONTENUS_PAR_PAGE,
  offset: f.offset ?? 0,
});

export const useContenusStaff = (f: FiltresContenus, enabled = true) =>
  useQuery({
    queryKey: ['staff-news', 'liste', params(f)],
    queryFn: async () =>
      pageSchema.parse(
        await api.get<unknown>('/v1/staff/news/', {
          params: params(f),
          quiet: true,
        }),
      ),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useContenuStaff = (id: string) =>
  useQuery({
    queryKey: ['staff-news', 'detail', id],
    queryFn: async () =>
      contenuStaffSchema.parse(
        await api.get<unknown>(`/v1/staff/news/${encodeURIComponent(id)}/`, {
          quiet: true,
        }),
      ),
    enabled: !!id,
    retry: false,
  });

/** `GET /v1/news/categories/` (liste simple, non paginée). */
export const useCategoriesStaff = () =>
  useQuery({
    queryKey: ['staff-news', 'categories'],
    queryFn: async () =>
      z
        .array(categorieSchema)
        .parse(await api.get<unknown>('/v1/news/categories/')),
    staleTime: 10 * 60 * 1000,
  });

export type ContenuInput = {
  node_id?: string | null;
  content_type: TypeContenu;
  title: string;
  excerpt?: string;
  content: string;
  category_id: number;
  is_sunday_notice?: boolean;
  sunday_date?: string | null;
  notify_followers?: boolean;
};

const useInvalider = () => {
  const qc = useQueryClient();
  return (c?: ContenuStaff) => {
    qc.invalidateQueries({ queryKey: ['staff-news', 'liste'] });
    if (c) qc.setQueryData(['staff-news', 'detail', c.id], c);
  };
};

export const useCreerContenu = () => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (data: ContenuInput) =>
      contenuStaffSchema.parse(
        await api.post<unknown>('/v1/staff/news/', data),
      ),
    onSuccess: invalider,
  });
};

export const useModifierContenu = (id: string) => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (data: Partial<Omit<ContenuInput, 'node_id'>>) =>
      contenuStaffSchema.parse(
        await api.patch<unknown>(
          `/v1/staff/news/${encodeURIComponent(id)}/`,
          data,
        ),
      ),
    onSuccess: invalider,
  });
};

export const usePublierContenu = () => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async ({
      id,
      publish_at = null,
    }: {
      id: string;
      publish_at?: string | null;
    }) =>
      contenuStaffSchema.parse(
        await api.post<unknown>(
          `/v1/staff/news/${encodeURIComponent(id)}/publish/`,
          { publish_at },
        ),
      ),
    onSuccess: invalider,
  });
};

export const useDepublierContenu = () => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async ({ id, reason = '' }: { id: string; reason?: string }) =>
      contenuStaffSchema.parse(
        await api.post<unknown>(
          `/v1/staff/news/${encodeURIComponent(id)}/unpublish/`,
          { reason },
        ),
      ),
    onSuccess: invalider,
  });
};

export const useSupprimerContenu = () => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<null>(`/v1/staff/news/${encodeURIComponent(id)}/`),
    onSuccess: () => invalider(),
  });
};

/** `POST /v1/staff/news/{id}/pin/ {until}` : épingle en tête (60 jours au plus). */
export const useEpinglerContenu = () => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async ({ id, until }: { id: string; until: string }) =>
      contenuStaffSchema.parse(
        await api.post<unknown>(
          `/v1/staff/news/${encodeURIComponent(id)}/pin/`,
          { until },
        ),
      ),
    onSuccess: invalider,
  });
};

/** `DELETE /v1/staff/news/{id}/pin/`. */
export const useDesepinglerContenu = () => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (id: string) =>
      contenuStaffSchema.parse(
        await api.delete<unknown>(
          `/v1/staff/news/${encodeURIComponent(id)}/pin/`,
        ),
      ),
    onSuccess: invalider,
  });
};
