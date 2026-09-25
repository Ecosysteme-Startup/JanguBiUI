import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const categorySchema = z.object({ id: z.number(), name: z.string(), slug: z.string(), display_order: z.number() });
export type NewsCategory = z.infer<typeof categorySchema>;

export const getNewsCategories = async (): Promise<NewsCategory[]> => z.array(categorySchema).parse(await api.get('/news/categories/'));

export const newsCategoriesQueryOptions = () =>
  queryOptions({ queryKey: ['news', 'categories'], queryFn: getNewsCategories, staleTime: 60 * 60 * 1000 });

/** Catégories (obligatoires à la création d'un contenu, SRS §7). */
export const useNewsCategories = () => useQuery(newsCategoriesQueryOptions());
