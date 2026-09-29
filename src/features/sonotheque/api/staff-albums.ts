import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import {
  pochetteInitSchema,
  staffAlbumDetailSchema,
  staffAlbumSchema,
  type AlbumKind,
  type PochetteInit,
  type StaffAlbum,
  type StaffAlbumDetail,
  type Visibilite,
} from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';
import {
  uploadToStorage,
  type StorageUploader,
  type UploadProgress,
} from './upload-to-storage';

// Espace staff : albums et pochettes (API-AUDIO §2 bis, audio.publier).

export type StaffAlbumsParams = { source?: string; kind?: AlbumKind };

// GET /audio/staff/albums/ — brouillons et albums retirés compris, les plus
// récents d'abord. Sans source gérée : [].
export const getStaffAlbums = async (
  params: StaffAlbumsParams = {},
): Promise<StaffAlbum[]> =>
  z.array(staffAlbumSchema).parse(
    await api.get<unknown>(`${AUDIO}/staff/albums/`, {
      params: {
        ...(params.source ? { source: params.source } : {}),
        ...(params.kind ? { kind: params.kind } : {}),
      },
    }),
  );

export const getStaffAlbumsQueryOptions = (params: StaffAlbumsParams = {}) =>
  queryOptions({
    queryKey: sonoKeys.staffAlbums(params),
    queryFn: () => getStaffAlbums(params),
  });

export const useStaffAlbums = (
  params: StaffAlbumsParams = {},
  { enabled = true } = {},
) => useQuery({ ...getStaffAlbumsQueryOptions(params), enabled });

// GET /audio/staff/albums/<id>/ — l'album et toutes ses pistes (StaffTrack,
// avec plays_30d) par position.
export const getStaffAlbum = async (id: string): Promise<StaffAlbumDetail> =>
  staffAlbumDetailSchema.parse(
    await api.get<unknown>(`${AUDIO}/staff/albums/${id}/`),
  );

export const useStaffAlbum = (id: string) =>
  useQuery({
    queryKey: sonoKeys.staffAlbum(id),
    queryFn: () => getStaffAlbum(id),
    enabled: !!id,
  });

export type AlbumInput = {
  kind: AlbumKind;
  title: string;
  visibility: Visibilite;
  description: string;
  recorded_on?: string | null;
  liturgical_season?: string;
};

// POST /audio/staff/albums/ → 201 StaffAlbum, non publié.
export const createStaffAlbum = async (
  input: AlbumInput & { source_id: string },
): Promise<StaffAlbum> =>
  staffAlbumSchema.parse(
    await api.post<unknown>(`${AUDIO}/staff/albums/`, input),
  );

// PATCH /audio/staff/albums/<id>/ → StaffAlbum. Changer la visibilité
// recalcule celle des pistes.
export const updateStaffAlbum = async (
  id: string,
  input: Partial<AlbumInput>,
): Promise<StaffAlbum> =>
  staffAlbumSchema.parse(
    await api.patch<unknown>(`${AUDIO}/staff/albums/${id}/`, input),
  );

// POST /audio/albums/<id>/publier/ — publie l'album et ses pistes prêtes.
export const publishAlbum = (id: string) =>
  api.post<unknown>(`${AUDIO}/albums/${id}/publier/`);

// ------------------------------------------------------------ pochette

export const POCHETTE_MAX = 5 * 1024 * 1024;
export const POCHETTE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPT_POCHETTE = POCHETTE_TYPES.join(',');

/** Vérification côté client (le serveur refait tout) : message ou null. */
export function verifierPochette(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (
    !POCHETTE_TYPES.includes(file.type) ||
    !['jpg', 'jpeg', 'png', 'webp'].includes(ext)
  )
    return 'Choisissez une image JPG, PNG ou WebP.';
  if (file.size === 0) return 'Cette image est vide.';
  if (file.size > POCHETTE_MAX) return 'L’image dépasse 5 Mo.';
  return null;
}

// 1. POST /audio/staff/albums/<id>/pochette/ → POST présigné.
export const initPochette = async (
  albumId: string,
  file: File,
): Promise<PochetteInit> =>
  pochetteInitSchema.parse(
    await api.post<unknown>(`${AUDIO}/staff/albums/${albumId}/pochette/`, {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    }),
  );

// 3. POST /audio/staff/albums/<id>/pochette/terminer/ → StaffAlbum (cover_url).
export const finishPochette = async (
  albumId: string,
  fileId: PochetteInit['file_id'],
): Promise<StaffAlbum> =>
  staffAlbumSchema.parse(
    await api.post<unknown>(
      `${AUDIO}/staff/albums/${albumId}/pochette/terminer/`,
      { file_id: fileId },
    ),
  );

/**
 * Envoi complet d'une pochette : autorisation, POST direct vers le stockage
 * (champs puis `file`), puis `terminer/` qui vérifie l'image et l'attache.
 */
export async function envoyerPochette(
  albumId: string,
  file: File,
  {
    uploader = uploadToStorage,
    onProgress = () => undefined,
  }: {
    uploader?: StorageUploader;
    onProgress?: (p: UploadProgress) => void;
  } = {},
): Promise<StaffAlbum> {
  const init = await initPochette(albumId, file);
  await uploader(init, file, onProgress);
  return finishPochette(albumId, init.file_id);
}

// ------------------------------------------------------------ mutations

const useInvaliderAlbums = () => {
  const qc = useQueryClient();
  return (album?: StaffAlbum) => {
    void qc.invalidateQueries({ queryKey: sonoKeys.staffAlbumsAll });
    if (album) {
      void qc.invalidateQueries({ queryKey: sonoKeys.staffAlbum(album.id) });
      void qc.invalidateQueries({ queryKey: sonoKeys.album(album.id) });
      void qc.invalidateQueries({ queryKey: sonoKeys.source(album.source.id) });
    }
  };
};

export const useCreateStaffAlbum = () => {
  const invalider = useInvaliderAlbums();
  return useMutation({
    mutationFn: createStaffAlbum,
    onSuccess: (a) => invalider(a),
  });
};

export const useUpdateStaffAlbum = () => {
  const invalider = useInvaliderAlbums();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AlbumInput> }) =>
      updateStaffAlbum(id, input),
    onSuccess: (a) => invalider(a),
  });
};

export const usePublishAlbum = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publishAlbum,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sonotheque', 'staff'] });
      void qc.invalidateQueries({ queryKey: sonoKeys.accueil });
    },
  });
};

export const useEnvoyerPochette = (uploader?: StorageUploader) => {
  const invalider = useInvaliderAlbums();
  return useMutation({
    mutationFn: ({ albumId, file }: { albumId: string; file: File }) =>
      envoyerPochette(albumId, file, { uploader }),
    onSuccess: (a) => invalider(a),
  });
};
