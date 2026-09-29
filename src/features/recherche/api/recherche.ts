import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Recherche transverse — backend `docs/API-V1-COMPLEMENTS.md` §3
// (`GET /v1/search/?q=&types=&limit=&offset=`). Publique ; connecté, s'ajoutent
// les prêtres joignables. `limit` et `offset` s'appliquent à chaque type.

export const TYPES_RECHERCHE = [
  'bible',
  'paroisses',
  'annonces',
  'pretres',
  'audio',
  'lieux',
] as const;
export type TypeRecherche = (typeof TYPES_RECHERCHE)[number];

export const LIBELLES_RECHERCHE: Record<TypeRecherche, string> = {
  bible: 'Bible',
  paroisses: 'Paroisses',
  annonces: 'Annonces',
  pretres: 'Prêtres',
  audio: 'Écoute',
  lieux: 'Lieux',
};

const groupe = <T extends z.ZodTypeAny>(item: T) =>
  z
    .object({ items: z.array(item), next_offset: z.number().nullable() })
    .optional();

export const resultatsSchema = z.object({
  q: z.string(),
  results: z.object({
    bible: groupe(
      z.object({
        id: z.number(),
        book_name: z.string(),
        book_slug: z.string(),
        // Identifiants des routes `bible/` (§5.1) : lien direct vers le lecteur.
        book_id: z.number().nullish(),
        chapter_id: z.number().nullish(),
        chapter: z.number(),
        verse: z.number(),
        text: z.string(),
      }),
    ),
    paroisses: groupe(
      z.object({
        id: z.string(),
        code: z.string().nullish(),
        name: z.string(),
        type: z.string(),
        city: z.string().nullish(),
        on_platform: z.boolean(),
      }),
    ),
    lieux: groupe(
      z.object({
        id: z.number(),
        name: z.string(),
        kind: z.string(),
        city: z.string().nullish(),
        node_id: z.string().nullish(),
        node_name: z.string().nullish(),
      }),
    ),
    annonces: groupe(
      z.object({
        id: z.string(),
        title: z.string(),
        excerpt: z.string().default(''),
        content_type: z.string(),
        published_at: z.string().nullish(),
        node_id: z.string().nullish(),
        node_name: z.string().nullish(),
      }),
    ),
    pretres: groupe(
      z.object({
        id: z.string(),
        name: z.string(),
        office: z.string(),
        node_id: z.string().nullish(),
        node_name: z.string().nullish(),
      }),
    ),
    audio: groupe(
      z.object({
        id: z.string(),
        title: z.string(),
        duration_seconds: z.number().nullish(),
        source_name: z.string().nullish(),
        album_id: z.string().nullish(),
        album_title: z.string().nullish(),
      }),
    ),
  }),
});
export type ResultatsRecherche = z.infer<typeof resultatsSchema>;

export const useRecherche = (q: string, type?: TypeRecherche) => {
  const terme = q.trim();
  return useQuery({
    queryKey: ['recherche', terme, type ?? 'tout'],
    queryFn: async () =>
      resultatsSchema.parse(
        await api.get<unknown>('/v1/search/', {
          params: {
            q: terme,
            types: type ?? TYPES_RECHERCHE.join(','),
            limit: type ? 20 : 5,
          },
          quiet: true,
        }),
      ),
    enabled: terme.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
};
