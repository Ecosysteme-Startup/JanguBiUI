import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type DonationState, donationStatusSchema } from '../types/schemas';

/** Intervalle de rafraîchissement tant que l'agrégateur n'a pas confirmé (la page se met à jour seule). */
export const PENDING_REFRESH_MS = 5000;

const WAITING = new Set(['initie', 'en_attente']);
export const isWaiting = (state: DonationState | undefined) => !state?.status || WAITING.has(state.status);

/** Statut d'un don au retour de l'agrégateur ; la confirmation vient toujours du serveur. */
export const getDonationStatus = async (donationId: string): Promise<DonationState> =>
  donationStatusSchema.parse(await api.get(`/dons/checkout/${encodeURIComponent(donationId)}/`));

export const donationStatusQueryOptions = (donationId: string) =>
  queryOptions({
    queryKey: ['dons', 'statut', donationId],
    queryFn: () => getDonationStatus(donationId),
    refetchInterval: (query) => (isWaiting(query.state.data) ? PENDING_REFRESH_MS : false),
  });

export const useDonationStatus = (donationId: string) => useQuery(donationStatusQueryOptions(donationId));
