import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Doublon assumé de la feature `actes` : l'accueil ne lit que ce dont il a besoin.
const requestSchema = z.object({
  id: z.string(),
  reference: z.string(),
  document_type_label: z.string(),
  document_type_free: z.string().optional().default(''),
  reason: z.string().optional().default(''),
  reason_free: z.string().optional().default(''),
  reason_label: z.string().optional().default(''),
  status: z.string(),
  status_label: z.string(),
  target_node: z.object({ id: z.string(), name: z.string() }).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CurrentRequest = z.infer<typeof requestSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(requestSchema) });

/** Statuts clos (SRS §8.1) : une demande dans l'un d'eux n'est plus « en cours ». */
export const CLOSED_STATUSES = ['collected', 'rejected', 'cancelled'];

/** Ma demande la plus récente encore ouverte (null s'il n'y en a pas). */
// Doublon assumé de `actes` (REASON_LABELS) : motifs affichés « pour mariage religieux ».
const REASON_LABELS: Record<string, string> = {
  religious_marriage: 'mariage religieux',
  godparent: 'parrainage',
  catechism: 'catéchèse',
  parish_file: 'dossier paroissial',
  personal: 'usage personnel',
};

/** Motif en minuscules (« mariage religieux »), ou le motif libre ; vide si inconnu. */
export const requestReason = (r: Pick<CurrentRequest, 'reason' | 'reason_free' | 'reason_label'>) => {
  if (r.reason_free) return r.reason_free;
  if (r.reason_label) return r.reason_label.charAt(0).toLowerCase() + r.reason_label.slice(1);
  return REASON_LABELS[r.reason] ?? '';
};

export const getCurrentRequest = async (): Promise<CurrentRequest | null> => {
  const page = pageSchema.parse(await api.get('/documents/requests/', { params: { limit: 5 } }));
  return page.results.find((r) => !CLOSED_STATUSES.includes(r.status)) ?? null;
};

export const currentRequestQueryOptions = () =>
  queryOptions({ queryKey: ['demandes', 'mine', 'en-cours'], queryFn: getCurrentRequest });

export const useCurrentRequest = () => useQuery(currentRequestQueryOptions());
