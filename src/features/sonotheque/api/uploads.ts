import { api } from '@/lib/api-client';

import {
  staffTrackSchema,
  uploadInitSchema,
  type StaffTrack,
  type UploadInit,
  type Visibilite,
} from '../types/schemas';

import { AUDIO } from './keys';

export type CreateUploadInput = {
  source_id: string;
  album_id?: string | null;
  title: string;
  visibility: Visibilite;
  file_name: string;
  file_type: string;
  file_size: number;
  rights_confirmed: boolean;
};

// 1. POST /audio/uploads/ → POST S3 présigné (audio-raw/, bucket privé).
export const createUpload = async (
  input: CreateUploadInput,
): Promise<UploadInit> =>
  uploadInitSchema.parse(
    await api.post<unknown>(`${AUDIO}/uploads/`, {
      ...input,
      album_id: input.album_id || undefined,
    }),
  );

// 3. POST /audio/uploads/<id>/terminer/ → 202 StaffTrack « en_file ».
// Idempotent : un second appel renvoie l'état courant sans relancer.
export const finishUpload = async (uploadId: string): Promise<StaffTrack> =>
  staffTrackSchema.parse(
    await api.post<unknown>(`${AUDIO}/uploads/${uploadId}/terminer/`),
  );

// 4. GET /audio/uploads/<id>/ → suivi de l'encodage.
export const getUpload = async (uploadId: string): Promise<StaffTrack> =>
  staffTrackSchema.parse(
    await api.get<unknown>(`${AUDIO}/uploads/${uploadId}/`),
  );

// Réessayer un encodage en échec : nouvelle version depuis le fichier source
// gardé dans audio-raw/ (202).
export const reencodeTrack = async (trackId: string): Promise<StaffTrack> =>
  staffTrackSchema.parse(
    await api.post<unknown>(`${AUDIO}/pistes/${trackId}/reencoder/`),
  );

// Publication d'une piste prête (409 piste_pas_prete sinon).
export const publishTrack = async (trackId: string): Promise<StaffTrack> =>
  staffTrackSchema.parse(
    await api.post<unknown>(`${AUDIO}/pistes/${trackId}/publier/`),
  );

export type UpdateTrackInput = Partial<{
  title: string;
  language: string;
  liturgical_season: string;
  description: string;
  visibility: Visibilite;
  album_id: string;
}>;

// PATCH /audio/pistes/<id>/ (audio.publier) → StaffTrack.
export const updateTrack = async (
  trackId: string,
  input: UpdateTrackInput,
): Promise<StaffTrack> =>
  staffTrackSchema.parse(
    await api.patch<unknown>(`${AUDIO}/pistes/${trackId}/`, input),
  );
