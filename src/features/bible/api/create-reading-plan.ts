import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { readingPlanSchema } from './get-reading-plans';
import type { ReadingPlan } from './get-reading-plans';

export type CreateReadingPlanInput = {
  title: string;
  description: string;
};

export const useCreateReadingPlan = ({
  onSuccess,
}: { onSuccess?: (plan: ReadingPlan) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReadingPlanInput): Promise<ReadingPlan> =>
      api
        .post<unknown>('/v1/bible/reading-plans/', data)
        .then((res) => readingPlanSchema.parse(res)),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['reading-plans'] });
      onSuccess?.(plan);
    },
  });
};
