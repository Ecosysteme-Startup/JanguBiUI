import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Liturgie des Heures — backend apps/liturgy (OfficeSerializer) :
//   GET /v1/liturgy/v1/<office>/?date=AAAA-MM-JJ&zone=afrique
// Sous-module « liturgy.heures » GELÉ en V1 (ADR-006, pas d'accord AELF) et
// réservé aux clercs et consacrés : l'écran reste derrière l'indicateur
// `heures` (config/features.ts).

const psaumeSchema = z
  .object({
    number: z.number().optional(),
    antienne: z.string().optional().default(''),
    // Bloc AELF brut : { reference?, titre?, texte? } ou texte seul.
    psaume: z
      .union([
        z.string(),
        z
          .object({
            reference: z.string().optional(),
            titre: z.string().optional(),
            texte: z.string().optional(),
          })
          .passthrough(),
      ])
      .optional(),
  })
  .passthrough();

const lectureBreveSchema = z
  .object({
    titre: z.string().optional(),
    reference: z.string().optional(),
    texte: z.string().optional(),
    repons: z.string().nullable().optional(),
  })
  .passthrough();

export const officeSchema = z.object({
  id: z.number(),
  office_type: z.string(),
  hymn: z.string().default(''),
  psalms: z.array(psaumeSchema).default([]),
  canticle: z.string().default(''),
  readings: z.array(lectureBreveSchema).default([]),
  intercessions: z.string().default(''),
  raw_metadata: z.record(z.string(), z.unknown()).default({}),
});

export type Office = z.infer<typeof officeSchema>;
export type OfficePsaume = z.infer<typeof psaumeSchema>;

export type OfficeKey =
  | 'laudes'
  | 'tierce'
  | 'sexte'
  | 'none'
  | 'vepres'
  | 'complies'
  | 'lectures';

export const getOffice = (
  officeKey: OfficeKey,
  date?: string,
): Promise<Office> =>
  api
    .get<unknown>(`/v1/liturgy/v1/${officeKey}/`, {
      params: date ? { date } : undefined,
    })
    .then((data) => officeSchema.parse(data));

export const getOfficeQueryOptions = (officeKey: OfficeKey, date?: string) =>
  queryOptions({
    queryKey: ['liturgy', 'office', officeKey, date],
    queryFn: () => getOffice(officeKey, date),
    retry: false,
  });

export const useOffice = (officeKey: OfficeKey, date?: string) =>
  useQuery(getOfficeQueryOptions(officeKey, date));
