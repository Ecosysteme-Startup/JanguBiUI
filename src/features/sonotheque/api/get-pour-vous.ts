import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { pourVousSchema, type PourVous } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/pour-vous/ — suggestions précalculées, chacune avec sa raison.
export const getPourVous = async (): Promise<PourVous> =>
  pourVousSchema.parse(await api.get<unknown>(`${AUDIO}/pour-vous/`));

export const getPourVousQueryOptions = () =>
  queryOptions({ queryKey: sonoKeys.pourVous, queryFn: getPourVous });

export const usePourVous = () => useQuery(getPourVousQueryOptions());

// PUT /audio/reglages/ — désactiver efface les recommandations calculées.
export const setRecommandations = (enabled: boolean) =>
  api.put<{ recommendations_enabled: boolean }>(`${AUDIO}/reglages/`, {
    recommendations_enabled: enabled,
  });

export const useSetRecommandations = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setRecommandations,
    onSuccess: () => qc.invalidateQueries({ queryKey: sonoKeys.pourVous }),
  });
};
