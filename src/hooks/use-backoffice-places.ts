import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const PLACE_KIND_LABELS: Record<string, string> = {
  eglise_paroissiale: 'Église paroissiale',
  succursale: 'Succursale',
  chapelle: 'Chapelle',
  station: 'Station',
  sanctuaire: 'Sanctuaire',
};

const placeSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  name: z.string(),
  kind: z.string(),
  is_main: z.boolean(),
  address: z.string().nullable().default(''),
  city: z.string().nullable().default(''),
  is_active: z.boolean().default(true),
});
export type Place = z.infer<typeof placeSchema>;

/** Lieux de culte d'un nœud, le lieu principal en tête (lecture publique). */
export const getBackofficePlaces = async (nodeId: string): Promise<Place[]> => {
  const places = z.array(placeSchema).parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/places/`));
  return [...places].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.name.localeCompare(b.name, 'fr'));
};

export const backofficePlacesQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['backoffice', 'places', nodeId], queryFn: () => getBackofficePlaces(nodeId) });

/** Lieux de culte du nœud courant du back-office (portée des annonces, horaires, agenda). */
export const useBackofficePlaces = (nodeId: string) => useQuery(backofficePlacesQueryOptions(nodeId));
