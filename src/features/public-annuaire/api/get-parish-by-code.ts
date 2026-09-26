import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api, ApiError } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

import { directoryNodeSchema } from './get-directory';

const officeHoursSchema = z.array(z.object({ days: z.string(), hours: z.string() }));

const parishSheetSchema = directoryNodeSchema.extend({
  /** `null` tant que la paroisse n'a pas choisi de publier son secrétariat. */
  secretariat: z.object({ phone: z.string(), email: z.string(), office_hours: officeHoursSchema }).nullable(),
  /** Clercs nommés sur la paroisse : nom et office, rien d'autre. */
  clergy: z.array(z.object({ name: z.string(), office: z.string() })),
  acts: z.object({ delay_days: z.number().nullable(), welcome_message: z.string() }),
});
export type ParishSheetData = z.infer<typeof parishSheetSchema>;
export type ParishSecretariat = NonNullable<ParishSheetData['secretariat']>;
export type ParishClergy = ParishSheetData['clergy'];

type _SheetKeys = Expect<Matches<Exclude<keyof ParishSheetData, keyof ResponseBody<'v1_public_nodes_by_code_retrieve'>>, never>>;

/** Résout le code d'URL (`/paroisses/DAK-SAINT-DOMINIQUE`) en fiche publique. `null` : paroisse inconnue (404). */
export const getParishByCode = async (code: string): Promise<ParishSheetData | null> => {
  const wanted = code.trim();
  if (!wanted) return null;
  try {
    return parishSheetSchema.parse(await api.get(`/public/nodes/by-code/${encodeURIComponent(wanted)}/`));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

export const parishByCodeQueryOptions = (code: string) =>
  queryOptions({ queryKey: ['public', 'parish', code], queryFn: () => getParishByCode(code), staleTime: 5 * 60 * 1000 });

export const useParishByCode = (code: string) => useQuery(parishByCodeQueryOptions(code));
