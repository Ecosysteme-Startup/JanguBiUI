import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Catalogue des offices (`GET /hierarchy/office-types/`) avec les règles de
// nomination : la fiche d'un compte ne propose que les fonctions que le
// périmètre peut attribuer. Clé propre : le catalogue court de la coquille
// (hooks/use-office-types) ne garde pas ces champs.

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
    queryKey: ['admin-comptes', 'office-types'],
    queryFn: async () =>
      z
        .array(typeOfficeSchema)
        .parse(await api.get<unknown>('/hierarchy/office-types/')),
    staleTime: 60 * 60 * 1000,
  });
