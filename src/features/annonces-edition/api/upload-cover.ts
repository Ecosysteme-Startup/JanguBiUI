import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const uploadedSchema = z.object({ id: z.number() });

export const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Bannière d'annonce : upload standard (multipart). Le serveur vérifie le type à l'attache. */
export const uploadCover = async (file: File): Promise<number> => {
  const form = new FormData();
  form.append('file', file);
  return uploadedSchema.parse(await api.post('/files/upload/standard/', form)).id;
};

export const useUploadCover = () => useMutation({ mutationFn: uploadCover });
