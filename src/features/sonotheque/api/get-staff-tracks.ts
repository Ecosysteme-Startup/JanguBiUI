import { queryOptions, useQueries } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { staffTrackSchema, type StaffTrack } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

// GET /audio/staff/pistes/?source=<id> — toutes les pistes d'une source avec
// leur état d'encodage (StaffTrack[]).
export const getStaffTracks = async (sourceId: string): Promise<StaffTrack[]> =>
  z.array(staffTrackSchema).parse(
    await api.get<unknown>(`${AUDIO}/staff/pistes/`, {
      params: { source: sourceId },
    }),
  );

const EN_COURS = new Set(['en_file', 'encodage']);

export const getStaffTracksQueryOptions = (sourceId: string) =>
  queryOptions({
    queryKey: sonoKeys.staffTracks(sourceId),
    queryFn: () => getStaffTracks(sourceId),
    // Tant qu'une piste s'encode, on rafraîchit doucement (30 s).
    refetchInterval: (q) =>
      q.state.data?.some((t) => EN_COURS.has(t.status)) ? 30_000 : false,
  });

/** Pistes de toutes les sources du staff, fusionnées. */
export const useStaffTracksForSources = (sourceIds: string[]) =>
  useQueries({
    queries: sourceIds.map((id) => getStaffTracksQueryOptions(id)),
    combine: (results) => ({
      data: results.flatMap((r) => r.data ?? []),
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
      refetch: () => results.forEach((r) => void r.refetch()),
    }),
  });
