import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import type { LiturgicalBannerData } from '@/components/signature/liturgical-banner';
import { api } from '@/lib/api-client';

const readingSchema = z.object({ type: z.string(), citation: z.string() });

const liturgyDaySchema = z.object({
  date: z.string(),
  calendar: z.object({
    celebration: z.string(),
    color: z.string(),
    season_label: z.string(),
    week: z.number().nullable(),
  }),
  readings: z.array(readingSchema),
});
export type LiturgyDay = z.infer<typeof liturgyDaySchema>;

/** Endpoint public : le bandeau liturgique de tous les shells (EF-PAR-01). */
export const getLiturgyToday = async (): Promise<LiturgyDay> => liturgyDaySchema.parse(await api.get('/liturgy/today/'));

export const liturgyTodayQueryOptions = () =>
  queryOptions({ queryKey: ['liturgy', 'today'], queryFn: getLiturgyToday, staleTime: 30 * 60 * 1000 });

export const toBannerData = (day: LiturgyDay): LiturgicalBannerData => ({
  date: day.date,
  celebration: day.calendar.celebration,
  color: day.calendar.color,
  references: day.readings.map((r) => r.citation),
});

export const useLiturgyToday = () => useQuery({ ...liturgyTodayQueryOptions(), select: toBannerData });
