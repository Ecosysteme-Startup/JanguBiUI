import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { type Place, placeSchema } from './schemas';

export const getPlaces = async (nodeId: string): Promise<Place[]> =>
  z
    .array(placeSchema)
    .parse(
      await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/places/`),
    );

export const placesQueryOptions = (nodeId: string) =>
  queryOptions({
    queryKey: ['confessions-planning', 'lieux', nodeId],
    queryFn: () => getPlaces(nodeId),
  });

export const usePlaces = (nodeId: string, { enabled }: { enabled: boolean }) =>
  useQuery({ ...placesQueryOptions(nodeId), enabled });
