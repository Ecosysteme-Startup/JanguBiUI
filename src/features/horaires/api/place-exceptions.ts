import { queryOptions, useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

export const exceptionSchema = z.object({
  id: z.number(),
  date: z.string(),
  kind: z.enum(['messe', 'confession', 'adoration']),
  cancelled: z.boolean().optional().default(false),
  start_time: z.string().nullable().optional().default(null),
  end_time: z.string().nullable().optional().default(null),
  note: z.string().optional().default(''),
});
export type ScheduleException = z.infer<typeof exceptionSchema>;

export const placeExceptionsKey = (placeId: number) => ['hierarchy', 'places', placeId, 'exceptions'] as const;

/** Exceptions À VENIR d'un lieu (le serveur filtre à partir d'aujourd'hui). */
export const getPlaceExceptions = async (placeId: number): Promise<ScheduleException[]> =>
  z.array(exceptionSchema).parse(await api.get(`/hierarchy/places/${placeId}/exceptions/`));

export const placeExceptionsQueryOptions = (placeId: number) =>
  queryOptions({ queryKey: placeExceptionsKey(placeId), queryFn: () => getPlaceExceptions(placeId) });

export const usePlaceExceptions = (placeIds: number[]) =>
  useQueries({
    queries: placeIds.map((id) => placeExceptionsQueryOptions(id)),
    combine: (results) => ({
      byPlace: Object.fromEntries(placeIds.map((id, i) => [id, results[i]?.data ?? []])) as Record<number, ScheduleException[]>,
      isPending: results.some((r) => r.isPending),
    }),
  });

type CreateBody = Omit<RequestBody<'v1_hierarchy_places_exceptions_create'>, 'id'>;
export type ExceptionInput = CreateBody;

export const createPlaceException = async (placeId: number, body: CreateBody): Promise<ScheduleException> =>
  exceptionSchema.parse(await api.post(`/hierarchy/places/${placeId}/exceptions/`, body));

export const deletePlaceException = (placeId: number, exceptionId: number): Promise<void> =>
  api.delete(`/hierarchy/places/${placeId}/exceptions/${exceptionId}/`);

export const useCreatePlaceException = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, body }: { placeId: number; body: CreateBody }) => createPlaceException(placeId, body),
    onSuccess: async (_created, { placeId }) => {
      await queryClient.invalidateQueries({ queryKey: placeExceptionsKey(placeId) });
      onSuccess?.();
    },
  });
};

export const useDeletePlaceException = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, exceptionId }: { placeId: number; exceptionId: number }) => deletePlaceException(placeId, exceptionId),
    onSuccess: (_void, { placeId }) => queryClient.invalidateQueries({ queryKey: placeExceptionsKey(placeId) }),
  });
};
