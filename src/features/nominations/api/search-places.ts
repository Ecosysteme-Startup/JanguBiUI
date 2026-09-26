import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const placeSchema = z.object({ id: z.string(), name: z.string(), type: z.object({ code: z.string(), label: z.string() }) });
export type NominationPlace = z.infer<typeof placeSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(placeSchema) });

export const PLACES_LIMIT = 20;

/** Lieux possibles d'une nomination : descendants du nœud courant, par nom, code ou ville. */
export const searchPlaces = async (within: string, q: string) =>
  pageSchema.parse(await api.get('/hierarchy/nodes/', { params: { within, q, limit: PLACES_LIMIT } }));

export const usePlaceSearch = (within: string, q: string) =>
  useQuery({
    queryKey: ['nominations', 'places', within, q],
    queryFn: () => searchPlaces(within, q),
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
  });
