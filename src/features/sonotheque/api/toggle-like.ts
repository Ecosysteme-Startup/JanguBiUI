import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { AUDIO, sonoKeys } from './keys';

// PUT / DELETE /audio/pistes/<id>/like/ — idempotents.
export const setLike = async ({
  trackId,
  liked,
}: {
  trackId: string;
  liked: boolean;
}): Promise<{ liked: boolean }> => {
  const url = `${AUDIO}/pistes/${trackId}/like/`;
  const raw = liked
    ? await api.put<unknown>(url)
    : await api.delete<unknown>(url);
  return z.object({ liked: z.boolean() }).parse(raw ?? { liked });
};

export const useToggleLike = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setLike,
    onSuccess: () => qc.invalidateQueries({ queryKey: sonoKeys.bibliotheque }),
  });
};
