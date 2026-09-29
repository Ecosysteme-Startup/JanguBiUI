import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { lectioDivinaSchema } from './get-lectio-sessions';
import type { LectioDivinaSession } from './get-lectio-sessions';

// Re-export schema for use in this module
export { lectioDivinaSchema };

export type SaveLectioInput = {
  passage_id: number | null;
  lectio?: string;
  meditatio?: string;
  oratio?: string;
  contemplatio?: string;
};

export const useSaveLectioSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveLectioInput): Promise<LectioDivinaSession> =>
      api
        .post<unknown>('/v1/bible/lectio/', data)
        .then((res) => lectioDivinaSchema.parse(res)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectio-sessions'] });
    },
  });
};
