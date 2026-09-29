import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type Activation, activationSchema, type Health, healthSchema } from '../types/schemas';

/** Santé des paiements (plateforme.admin) : notifications, attentes, reversements, incidents. Aucun donateur. */
export const getPaymentsHealth = async (): Promise<Health> => healthSchema.parse(await api.get('/platform/dons/sante/'));

export const paymentsHealthQueryOptions = () =>
  queryOptions({ queryKey: ['dons', 'plateforme', 'sante'], queryFn: getPaymentsHealth, refetchInterval: 60_000 });

export const usePaymentsHealth = () => useQuery(paymentsHealthQueryOptions());

export const getActivations = async (): Promise<Activation[]> => activationSchema.array().parse(await api.get('/platform/dons/activations/'));

export const activationsQueryOptions = () => queryOptions({ queryKey: ['dons', 'plateforme', 'activations'], queryFn: getActivations });

export const useActivations = () => useQuery(activationsQueryOptions());

export type ActivationBody = RequestBody<'platform_dons_activations_set'>;

/** Active ou suspend la collecte d'une paroisse (autorisation écrite de l'Ordinaire, H4). */
export const setActivation = async (body: ActivationBody): Promise<Activation> =>
  activationSchema.parse(await api.put('/platform/dons/activations/', body));

export const useSetActivation = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: setActivation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dons', 'plateforme'] }) });
};
