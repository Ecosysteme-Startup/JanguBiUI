import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const sheetSchema = z.object({
  id: z.string(),
  code: z.string(),
  deanery_name: z.string().nullish(),
  diocese_name: z.string().nullish(),
  /** `null` tant que la paroisse n'a pas publié son secrétariat. */
  secretariat: z
    .object({
      phone: z.string().catch(''),
      email: z.string().catch(''),
      office_hours: z.array(z.object({ days: z.string(), hours: z.string() }).passthrough()).catch([]),
    })
    .nullish(),
  /** Clercs titulaires d'un office actif (nom et titre : Curé, Vicaire paroissial…). */
  clergy: z.array(z.object({ name: z.string(), office: z.string() })).catch([]),
});
export type ParishSheet = z.infer<typeof sheetSchema>;

/** Fiche publique de la paroisse (`GET /public/nodes/by-code/{code}/`) : secrétariat publié et clergé titré. */
export const getParishSheet = async (code: string): Promise<ParishSheet> =>
  sheetSchema.parse(await api.get(`/public/nodes/by-code/${encodeURIComponent(code)}/`));

export const parishSheetQueryOptions = (code: string) =>
  queryOptions({ queryKey: ['paroisse', 'fiche-publique', code], queryFn: () => getParishSheet(code), staleTime: 30 * 60 * 1000, retry: false });

export const useParishSheet = (code: string | undefined) => useQuery({ ...parishSheetQueryOptions(code ?? ''), enabled: Boolean(code) });
