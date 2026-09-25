import { HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { cache } from 'react';

import { getLiturgyDay, liturgyDayQueryOptions } from '@/features/public-parole/api/get-liturgy-day';
import { ParoleDuJour } from '@/features/public-parole/components/parole-du-jour';
import { parseDateParam } from '@/features/public-parole/utils/days';
import { prefetchPublic } from '@/lib/server-prefetch';
import { longDate } from '@/utils/dates';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const loadDay = cache(async (date?: string) => {
  try {
    return await getLiturgyDay(date);
  } catch {
    return null;
  }
});

export const generateMetadata = async ({ searchParams }: Props): Promise<Metadata> => {
  const date = parseDateParam((await searchParams).date);
  const day = await loadDay(date);
  if (!day) return { title: 'La Parole du jour' };
  return {
    title: `La Parole du jour · ${longDate(day.date)}`,
    description: `${day.calendar.celebration}. Lectures de la messe : ${day.readings.map((r) => r.citation).join(' · ') || 'à venir'}.`,
  };
};

/** Parole du jour publique (PUB-Parole-du-jour) ; la date vit dans l'URL (`?date=`). */
const ParolePage = async ({ searchParams }: Props) => {
  const date = parseDateParam((await searchParams).date);
  const day = await loadDay(date);
  const state = day ? await prefetchPublic({ ...liturgyDayQueryOptions(date), queryFn: async () => day }) : undefined;
  return (
    <HydrationBoundary state={state}>
      <ParoleDuJour date={date} />
    </HydrationBoundary>
  );
};

export default ParolePage;
