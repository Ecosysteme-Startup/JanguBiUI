import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

const officeTypeSchema = z.object({
  code: z.string(),
  label: z.string(),
  node_types: z.array(z.string()),
  required_order: z.enum(['aucun', 'diacre', 'pretre', 'eveque']).optional(),
  cardinality: z.enum(['one', 'many']).optional(),
  appointed_by: z.array(z.string()),
  appointed_by_platform: z.boolean().optional(),
  capabilities: z.array(z.string()),
  inherits_down: z.boolean().optional(),
});
export type OfficeType = z.infer<typeof officeTypeSchema>;

type _OfficeTypesMatchContract = Expect<Matches<OfficeType[], ResponseBody<'v1_hierarchy_office_types_list'>>>;

export const REQUIRED_ORDER: Record<string, string> = { aucun: 'Aucune', diacre: 'Diacre', pretre: 'Prêtre', eveque: 'Évêque' };

export const getOfficeCatalogue = async (): Promise<OfficeType[]> =>
  z.array(officeTypeSchema).parse(await api.get('/hierarchy/office-types/'));

/** Catalogue complet des offices (capacités, nommeurs, héritage). */
export const useOfficeCatalogue = () =>
  useQuery({ queryKey: ['referentiels', 'office-types'], queryFn: getOfficeCatalogue, staleTime: 30 * 60 * 1000 });
