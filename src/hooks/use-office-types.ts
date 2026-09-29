import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const officeTypeSchema = z.object({
  code: z.string(),
  label: z.string(),
  node_types: z.array(z.string()).default([]),
  /** Titres possibles du titulaire (« Curé », « Administrateur paroissial ») ; le premier par défaut. */
  qualities: z.array(z.object({ code: z.string(), label: z.string() })).default([]),
});

export const getOfficeTypes = async () => z.array(officeTypeSchema).parse(await api.get('/hierarchy/office-types/'));

export const officeTypesQueryOptions = () =>
  queryOptions({ queryKey: ['hierarchy', 'office-types'], queryFn: getOfficeTypes, staleTime: 60 * 60 * 1000 });

/**
 * Libellé d'un office au catalogue (« Secrétaire paroissial ») ; vide en attendant le catalogue.
 * Pour une personne, préférer son titre réel (`office_label` de l'API).
 */
export const useOfficeLabel = (code: string | undefined): string => {
  const { data } = useQuery(officeTypesQueryOptions());
  if (!code) return '';
  if (code === 'plateforme') return 'Administrateur plateforme';
  return data?.find((o) => o.code === code)?.label ?? '';
};
