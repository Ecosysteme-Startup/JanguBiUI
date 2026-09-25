import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const officeTypeSchema = z.object({ code: z.string(), label: z.string() });

export const getOfficeTypes = async () => z.array(officeTypeSchema).parse(await api.get('/hierarchy/office-types/'));

export const officeTypesQueryOptions = () =>
  queryOptions({ queryKey: ['hierarchy', 'office-types'], queryFn: getOfficeTypes, staleTime: 60 * 60 * 1000 });

/** Libellé d'un office (« Secrétaire paroissial ») ; le code en attendant le catalogue. */
export const useOfficeLabel = (code: string | undefined): string => {
  const { data } = useQuery(officeTypesQueryOptions());
  if (!code) return '';
  if (code === 'plateforme') return 'Administrateur plateforme';
  return data?.find((o) => o.code === code)?.label ?? '';
};
