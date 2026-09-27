import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const uploadedSchema = z.object({ id: z.number() });

export const FUND_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const;
export const MAX_FUND_IMAGE_BYTES = 5 * 1024 * 1024;

/** Visuel d'une campagne : upload standard (multipart), attaché ensuite au fonds par `image_id`. */
export const uploadFundImage = async (file: File): Promise<number> => {
  const form = new FormData();
  form.append('file', file);
  return uploadedSchema.parse(await api.post('/files/upload/standard/', form)).id;
};

export const useUploadFundImage = () => useMutation({ mutationFn: uploadFundImage });
