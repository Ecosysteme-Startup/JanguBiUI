import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { accueilSchema, type Accueil } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/accueil/ — toutes les sections de l'accueil « Écouter » en un
// appel (reprendre, nouveautés de ma paroisse, pour vous, playlists de la
// paroisse, temps liturgique ; 10 éléments au plus par section).
export const getAccueil = async (): Promise<Accueil> =>
  accueilSchema.parse(await api.get<unknown>(`${AUDIO}/accueil/`));

export const getAccueilQueryOptions = () =>
  queryOptions({ queryKey: sonoKeys.accueil, queryFn: getAccueil });

export const useAccueil = () => useQuery(getAccueilQueryOptions());
