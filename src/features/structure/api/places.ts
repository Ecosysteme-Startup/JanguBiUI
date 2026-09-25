import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, RequestBody, ResponseBody } from '@/types/api-contract';

import { structureKeys } from './node-schema';

export const PLACE_KINDS = {
  eglise_paroissiale: 'Église paroissiale',
  succursale: 'Succursale',
  chapelle: 'Chapelle',
  station: 'Station',
  sanctuaire: 'Sanctuaire',
} as const;

const placeSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  name: z.string(),
  kind: z.enum(['eglise_paroissiale', 'succursale', 'chapelle', 'station', 'sanctuaire']).optional(),
  is_main: z.boolean().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  lat: z.string().nullable().optional(),
  lng: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});
export type Place = z.infer<typeof placeSchema>;

type _PlaceMatchesContract = Expect<Matches<Place, ResponseBody<'v1_hierarchy_places_retrieve'>>>;

export type PlaceCreateBody = RequestBody<'v1_hierarchy_nodes_places_create'>;
export type PlaceUpdateBody = RequestBody<'v1_hierarchy_places_partial_update'>;

export const getPlaces = async (nodeId: string): Promise<Place[]> =>
  z.array(placeSchema).parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/places/`));

/** Lieux de culte d'un nœud (lecture publique). */
export const usePlaces = (nodeId: string) => useQuery({ queryKey: structureKeys.places(nodeId), queryFn: () => getPlaces(nodeId) });

export const createPlace = async ({ nodeId, body }: { nodeId: string; body: PlaceCreateBody }): Promise<Place> =>
  placeSchema.parse(await api.post(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/places/`, body));

export const updatePlace = async ({ id, body }: { id: number; body: PlaceUpdateBody }): Promise<Place> =>
  placeSchema.parse(await api.patch(`/hierarchy/places/${id}/`, body));

export const useSavePlace = (nodeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: PlaceCreateBody }) => (id ? updatePlace({ id, body }) : createPlace({ nodeId, body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: structureKeys.places(nodeId) }),
  });
};
