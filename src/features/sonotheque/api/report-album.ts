import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { AUDIO } from './keys';
import type { MotifSignalement } from './report-track';

// POST /audio/albums/<id>/signaler/ → 201 ; un album entier (pochette,
// présentation, ensemble des pistes). 404 album_introuvable si non visible.
export const reportAlbum = ({
  albumId,
  motif,
  comment,
}: {
  albumId: string;
  motif: MotifSignalement;
  comment: string;
}) =>
  api.post<unknown>(`${AUDIO}/albums/${albumId}/signaler/`, { motif, comment });

export const useReportAlbum = () => useMutation({ mutationFn: reportAlbum });
