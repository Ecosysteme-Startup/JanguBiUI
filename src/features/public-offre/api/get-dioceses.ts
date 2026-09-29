import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const pageSchema = z.object({ results: z.array(z.object({ id: z.string(), name: z.string() })) });
export type DioceseOption = { id: string; name: string };

/** Diocèses proposés dans le formulaire (annuaire public, type « diocese »). */
export const getContactDioceses = async (): Promise<DioceseOption[]> =>
  pageSchema.parse(await api.get('/public/nodes/', { params: { type: 'diocese', limit: 50 } })).results;

export const contactDiocesesQueryOptions = () =>
  queryOptions({ queryKey: ['public', 'contact', 'dioceses'], queryFn: getContactDioceses, staleTime: 30 * 60 * 1000 });

export const useContactDioceses = () => useQuery(contactDiocesesQueryOptions());
