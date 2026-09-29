import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const placeSchema = z.object({ id: z.number(), name: z.string(), address: z.string().nullish(), is_main: z.boolean().optional() });
export type Place = z.infer<typeof placeSchema>;

/** Lieux de culte de la paroisse (lecture publique) : lieu de retrait de l'original. */
export const getNodePlaces = async (nodeId: string): Promise<Place[]> =>
  z.array(placeSchema).parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/places/`));

export const nodePlacesQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['hierarchy', 'nodes', nodeId, 'places'], queryFn: () => getNodePlaces(nodeId), staleTime: 30 * 60 * 1000 });

export const useNodePlaces = (nodeId: string | null) => useQuery({ ...nodePlacesQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
