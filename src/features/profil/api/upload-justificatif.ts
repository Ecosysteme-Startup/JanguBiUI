import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const uploadedSchema = z.object({ id: z.number() });

// Doublon assumé de la feature `actes` (pas d'import entre features).
/** Justificatif de l'état de vie (upload standard, multipart) : renvoie l'identifiant du fichier. */
export const uploadJustificatif = async (file: File): Promise<number> => {
  const form = new FormData();
  form.append('file', file);
  return uploadedSchema.parse(await api.post('/files/upload/standard/', form)).id;
};

export const useUploadJustificatif = () => useMutation({ mutationFn: uploadJustificatif });
