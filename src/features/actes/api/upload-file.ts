import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const uploadedSchema = z.object({ id: z.number() });

/** Pièce justificative du fidèle (upload standard, multipart). Jamais l'acte lui-même. */
export const uploadFile = async (file: File): Promise<number> => {
  const form = new FormData();
  form.append('file', file);
  return uploadedSchema.parse(await api.post('/files/upload/standard/', form)).id;
};

export const useUploadFile = () => useMutation({ mutationFn: uploadFile });
