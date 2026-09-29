import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { pourVousSchema, type PourVous } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/pour-vous/ — suggestions précalculées, chacune avec sa raison.
export const getPourVous = async (): Promise<PourVous> =>
  pourVousSchema.parse(await api.get<unknown>(`${AUDIO}/pour-vous/`));

export const getPourVousQueryOptions = () =>
  queryOptions({ queryKey: sonoKeys.pourVous, queryFn: getPourVous });

export const usePourVous = () => useQuery(getPourVousQueryOptions());

const reglagesSchema = z.object({ recommendations_enabled: z.boolean() });
export type Reglages = z.infer<typeof reglagesSchema>;

// GET /audio/reglages/ — suggestions personnalisées ou non.
export const getReglages = async (): Promise<Reglages> =>
  reglagesSchema.parse(await api.get<unknown>(`${AUDIO}/reglages/`));

export const useReglages = ({ enabled = true } = {}) =>
  useQuery({ queryKey: sonoKeys.reglages, queryFn: getReglages, enabled });

// PUT /audio/reglages/ — désactiver efface les recommandations calculées.
export const setRecommandations = (enabled: boolean) =>
  api.put<Reglages>(`${AUDIO}/reglages/`, {
    recommendations_enabled: enabled,
  });

export const useSetRecommandations = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setRecommandations,
    onSuccess: (_d, enabled) => {
      qc.setQueryData<Reglages>(sonoKeys.reglages, {
        recommendations_enabled: enabled,
      });
      void qc.invalidateQueries({ queryKey: sonoKeys.pourVous });
      void qc.invalidateQueries({ queryKey: sonoKeys.accueil });
    },
  });
};
