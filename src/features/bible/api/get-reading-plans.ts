import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const readingPlanSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  is_published: z.boolean(),
  is_subscribed: z.boolean().default(false),
  author_email: z.string().email().nullable().optional(),
  created_at: z.string(),
});

export type ReadingPlan = z.infer<typeof readingPlanSchema>;

type PlansResponse = { count: number; results: ReadingPlan[] };

const parsePlans = (data: unknown): PlansResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => readingPlanSchema.parse(item)),
  };
};

export const getReadingPlans = (): Promise<PlansResponse> =>
  api.get<unknown>('/v1/bible/reading-plans/').then(parsePlans);

export const getReadingPlansQueryOptions = () =>
  queryOptions({ queryKey: ['reading-plans'], queryFn: getReadingPlans });

export const useReadingPlans = () => useQuery(getReadingPlansQueryOptions());
