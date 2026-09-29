import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { AUDIO } from './keys';

export const MOTIFS_SIGNALEMENT = [
  { value: 'droits', label: 'Droits d’auteur' },
  { value: 'inapproprie', label: 'Contenu inapproprié' },
  { value: 'qualite', label: 'Qualité du son' },
  { value: 'autre', label: 'Autre raison' },
] as const;
export type MotifSignalement = (typeof MOTIFS_SIGNALEMENT)[number]['value'];

// POST /audio/pistes/<id>/signaler/ → 201.
export const reportTrack = ({
  trackId,
  motif,
  comment,
}: {
  trackId: string;
  motif: MotifSignalement;
  comment: string;
}) =>
  api.post<unknown>(`${AUDIO}/pistes/${trackId}/signaler/`, { motif, comment });

export const useReportTrack = () => useMutation({ mutationFn: reportTrack });
