import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const officeSchema = z.object({
  code: z.string(),
  label: z.string(),
  node_types: z.array(z.string()).default([]),
  appointed_by: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  inherits_down: z.boolean().default(false),
});
export type Office = z.infer<typeof officeSchema>;

export const getOfficeCatalogue = async () => z.array(officeSchema).parse(await api.get('/hierarchy/office-types/'));

/** Catalogue complet (capacités, types de nœuds) — clé distincte du libellé seul du shell. */
export const officeCatalogueQueryOptions = () =>
  queryOptions({ queryKey: ['equipe', 'office-catalogue'], queryFn: getOfficeCatalogue, staleTime: 60 * 60 * 1000 });

export const useOfficeCatalogue = () => useQuery(officeCatalogueQueryOptions());
