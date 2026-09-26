import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

import { ARTICLE_STATUSES } from './staff-article';

const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  content_format: z.enum(['text', 'html']),
  scope: z.object({
    node_id: z.string().nullable(),
    node_name: z.string().nullable(),
    place_id: z.number().nullable(),
    place_name: z.string().nullable(),
  }),
  status: z.enum(ARTICLE_STATUSES),
});

const sheetSchema = z.object({ node_id: z.string(), node_name: z.string(), sunday: z.string(), items: z.array(itemSchema) });
export type SundaySheet = z.infer<typeof sheetSchema>;
export type SundaySheetItem = z.infer<typeof itemSchema>;

// Garde de contrat : les clés lues ici existent dans la réponse du serveur.
type _SheetKeys = Expect<Matches<Exclude<keyof SundaySheet, keyof ResponseBody<'staff_news_sunday_sheet'>>, never>>;

/** Feuille d'annonces d'un dimanche : annonces du nœud (publiées ou programmées), puis des nœuds parents. */
export const getSundaySheet = async (nodeId: string, sunday?: string): Promise<SundaySheet> =>
  sheetSchema.parse(await api.get('/staff/news/sunday-sheet/', { params: { node: nodeId, date: sunday } }));

export const sundaySheetQueryOptions = (nodeId: string, sunday?: string) =>
  queryOptions({ queryKey: ['staff', 'news', 'sunday-sheet', nodeId, sunday ?? 'next'], queryFn: () => getSundaySheet(nodeId, sunday) });

export const useSundaySheet = (nodeId: string, sunday?: string) => useQuery(sundaySheetQueryOptions(nodeId, sunday));
