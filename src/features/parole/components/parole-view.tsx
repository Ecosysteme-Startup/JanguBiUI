'use client';

import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/paths';
import { type LiturgyDay, liturgyDayQueryOptions, useLiturgyDay } from '@/features/parole/api/get-liturgy-day';
import { DayNav } from '@/features/parole/components/day-nav';
import { MeditationCard } from '@/features/parole/components/meditation-card';
import { OrdinalText } from '@/features/parole/components/ordinal-text';
import { OtherReadings } from '@/features/parole/components/other-readings';
import { ParoleNav } from '@/features/parole/components/parole-nav';
import { ReadingPager } from '@/features/parole/components/reading-pager';
import { ReadingSection } from '@/features/parole/components/reading-section';
import { ReadingsAside } from '@/features/parole/components/readings-aside';
import type { TextSize } from '@/features/parole/components/text-size-control';
import { isGospel, ISO, readingTabLabel, weekOf } from '@/features/parole/utils/liturgy';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';
import { dayjs, longDate } from '@/utils/dates';

const defaultTab = (day: LiturgyDay) => {
  const gospel = day.readings.findIndex((r) => isGospel(r.type));
  return gospel >= 0 ? gospel : 0;
};

const WEEKDAY = /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i;

/** « Jeudi 24 septembre 2026, jeudi de la 25e semaine du temps ordinaire ». */
const DayLine = ({ date, celebration }: { date: string; celebration?: string }) => (
  <>
    {longDate(date)}
    {celebration && (
      <>
        , <OrdinalText text={WEEKDAY.test(celebration) ? celebration.charAt(0).toLowerCase() + celebration.slice(1) : celebration} />
      </>
    )}
  </>
);

const LiturgyContent = ({ day, busy }: { day: LiturgyDay; busy: boolean }) => {
  const [size, setSize] = useState<TextSize>('normal');
  const [tab, setTab] = useState<number | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const active = tab ?? defaultTab(day);
  const sundayIso = weekOf(day.date)[6];
  const sunday = useQuery({ ...liturgyDayQueryOptions(sundayIso), placeholderData: undefined, enabled: sundayIso !== day.date });
  const reading = day.readings[active];

  const select = (index: number) => {
    setTab(index);
    top.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  };

  return (
    <div aria-busy={busy} className={cn('mt-10 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start', busy && 'opacity-60 transition-opacity')}>
      <div ref={top} className="min-w-0 scroll-mt-6">
        {!day.readings_available || !reading ? (
          <EmptyState icon="parole" title="Les lectures de ce jour ne sont pas encore en ligne.">
            <p className="m-0">
              Le calendrier liturgique est bien celui du {longDate(day.date).toLowerCase()} ; les textes seront publiés dès que possible. En
              attendant, vous pouvez ouvrir la{' '}
              <NextLink href={paths.app.bible.root.getHref()} className="text-primary underline underline-offset-4">
                Bible
              </NextLink>
              .
            </p>
          </EmptyState>
        ) : (
          <>
            <Tabs value={String(active)} onValueChange={(v) => setTab(Number(v))}>
              <TabsList size="lg" aria-label="Lectures du jour">
                {day.readings.map((r, i) => (
                  <TabsTrigger key={`${r.type}-${i}`} value={String(i)}>
                    {readingTabLabel(day.readings, i)}
                  </TabsTrigger>
                ))}
              </TabsList>
              {day.readings.map((r, i) => (
                <TabsContent key={`${r.type}-${i}`} value={String(i)}>
                  <ReadingSection reading={r} date={day.date} notice={day.notice} size={size} onSize={setSize} />
                </TabsContent>
              ))}
            </Tabs>
            <ReadingPager readings={day.readings} active={active} onSelect={select} />
          </>
        )}
        {day.meditation && <MeditationCard meditation={day.meditation} />}
        {reading && <OtherReadings readings={day.readings} active={active} onSelect={select} />}
      </div>
      <ReadingsAside day={day} sunday={sunday.data} />
    </div>
  );
};

/** La Parole du jour (FID-Parole) : `/liturgy/today/` ou `/liturgy/{date}/`. */
export const ParoleView = ({ date }: { date?: string }) => {
  const query = useLiturgyDay(date);
  const shown = query.data?.date ?? date ?? dayjs().format(ISO);
  const today = dayjs().format(ISO);

  return (
    <div className="min-w-0">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="m-0 text-32 font-semibold text-ink">La Parole du jour</h1>
          <p className="m-0 mt-2 text-16 text-ink-2">
            <DayLine date={shown} celebration={query.data?.calendar.celebration} />
          </p>
          {shown !== today && (
            <NextLink href={paths.app.parole.getHref()} className="mt-1 inline-flex min-h-11 items-center text-15 font-medium">
              Revenir aux lectures d’aujourd’hui
            </NextLink>
          )}
        </div>
        <ParoleNav current="jour" />
      </header>

      <div className="mt-6">
        <DayNav date={shown} current={query.data} />
      </div>

      {query.isPending ? (
        <div className="mt-10 max-w-parole">
          <LoadingBlock label="Chargement des lectures…" lines={6} />
        </div>
      ) : query.isError && !query.data ? (
        <EmptyState
          tone="err"
          icon="alerte"
          title="Impossible d’afficher les lectures."
          className="mt-10"
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Réessayer
            </Button>
          }
        >
          <p className="m-0">{query.error instanceof ApiError ? query.error.message : 'Le service ne répond pas. Réessayez dans un instant.'}</p>
        </EmptyState>
      ) : (
        query.data && <LiturgyContent key={query.data.date} day={query.data} busy={query.isPlaceholderData} />
      )}
    </div>
  );
};
