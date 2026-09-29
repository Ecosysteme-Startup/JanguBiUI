import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { staffNewsKey } from './staff-article';

// Épinglage d'une annonce en tête du fil de la paroisse (compléments V1, §2.1) :
// `POST /staff/news/{id}/pin/ {until}` (60 jours au plus), `DELETE …/pin/`.
// `is_pinned` et `pinned_until` sont lus à part : ils ne figurent pas encore
// dans le schéma OpenAPI sur lequel reposent les gardes de `staff-article.ts`.

const epinglageSchema = z.object({
  status: z.string(),
  is_pinned: z.boolean().default(false),
  pinned_until: z.string().nullable().optional(),
});
export type Epinglage = z.infer<typeof epinglageSchema>;

const epinglageKey = (articleId: string) =>
  [...staffNewsKey, 'epinglage', articleId] as const;

export const useEpinglage = (articleId: string | null) =>
  useQuery({
    queryKey: epinglageKey(articleId ?? ''),
    queryFn: async () =>
      epinglageSchema.parse(
        await api.get(`/staff/news/${encodeURIComponent(articleId ?? '')}/`),
      ),
    enabled: !!articleId,
  });

export const useEpingler = (articleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (until: string) =>
      epinglageSchema.parse(
        await api.post(`/staff/news/${encodeURIComponent(articleId)}/pin/`, {
          until,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffNewsKey }),
  });
};

export const useDesepingler = (articleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      epinglageSchema.parse(
        await api.delete(`/staff/news/${encodeURIComponent(articleId)}/pin/`),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffNewsKey }),
  });
};
