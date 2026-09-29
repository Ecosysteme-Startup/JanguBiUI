import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { sourceSchema, type Source } from '../types/schemas';
import { compareFr } from '../utils/format';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/staff/sources/ — sources où l'on peut publier (audio.publier).
export const getStaffSources = async (): Promise<Source[]> =>
  z
    .array(sourceSchema)
    .parse(await api.get<unknown>(`${AUDIO}/staff/sources/`))
    .sort((a, b) => compareFr(a.name, b.name));

export const getStaffSourcesQueryOptions = () =>
  queryOptions({ queryKey: sonoKeys.staffSources, queryFn: getStaffSources });

export const useStaffSources = () => useQuery(getStaffSourcesQueryOptions());
