'use client';

import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';

import { LITURGICAL_DOT, LiturgicalDot, type LiturgicalDotColor } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Skeleton, SkeletonLine } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { liturgyTodayQueryOptions } from '@/hooks/use-liturgy-today';
import { cn } from '@/utils/cn';
import { longDate } from '@/utils/dates';

import { OrdinalText } from './ordinal-text';

const READING_LABEL: Record<string, string> = {
  lecture_1: 'Première lecture',
  lecture_2: 'Deuxième lecture',
  psaume: 'Psaume',
  cantique: 'Cantique',
  evangile: 'Évangile',
};

const GRID_COLS = ['grid-cols-1', 'grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4'];

const heroClass = 'rounded-16 bg-primary-fill p-6 text-lit-white sm:p-8';

/** Même gabarit que le contenu chargé (date, célébration, trois lectures, bouton) : aucun décalage à l'arrivée. */
const WordOfTheDaySkeleton = () => (
  <div role="status" data-testid="parole-squelette" className={heroClass}>
    <h2 id="acc-parole" className="sr-only">
      La Parole du jour
    </h2>
    <span className="sr-only">Chargement des lectures du jour…</span>
    <SkeletonLine className="text-14" width="w-40" />
    <SkeletonLine className="mt-2 text-22" width="w-3/4" />
    <ul aria-hidden="true" className="m-0 mt-6 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <span className="block h-1 rounded-full bg-primary-fill-hover" />
          <SkeletonLine className="mt-2.5 text-13" width="w-24" />
          <SkeletonLine className="text-15" width="w-20" />
        </li>
      ))}
    </ul>
    <Skeleton className="mt-6 h-12 w-60" />
  </div>
);

/** « La Parole du jour » (FID-Accueil) : aplat bleu, célébration, lectures, vers /app/parole. */
export const WordOfTheDay = ({ className }: { className?: string }) => {
  const { data: day, isPending, isError } = useQuery(liturgyTodayQueryOptions());
  const color = LITURGICAL_DOT[day?.calendar.color as LiturgicalDotColor] ?? null;

  return (
    <section aria-labelledby="acc-parole" className={cn('min-w-0', className)}>
      {isPending ? (
        <WordOfTheDaySkeleton />
      ) : isError ? (
        <div className={heroClass}>
          <h2 id="acc-parole" className="m-0 text-22 font-semibold">
            La Parole du jour
          </h2>
          <p className="m-0 mt-2 text-15 text-on-night">Les lectures du jour n’ont pas pu être chargées.</p>
        </div>
      ) : (
        <div className={heroClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-14 text-on-night">
              <span className="sr-only">La Parole du jour, </span>
              {longDate(day.date)}
            </p>
            {color && (
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-lit-white px-3 text-13 font-medium text-night">
                <LiturgicalDot color={day.calendar.color} size={8} />
                <span className="sr-only">Couleur liturgique : </span>
                {color.label}
              </span>
            )}
          </div>
          <h2 id="acc-parole" className="m-0 mt-2 text-22 font-semibold">
            <OrdinalText text={day.calendar.celebration} />
          </h2>
          {day.readings.length > 0 && (
            <ul className={cn('m-0 mt-6 grid list-none gap-4 p-0', GRID_COLS[Math.min(day.readings.length, 4)])}>
              {day.readings.map((r, i) => (
                <li key={`${r.type}-${i}`} className="min-w-0">
                  <span
                    aria-hidden="true"
                    className={cn('block h-1 rounded-full', r.type === 'evangile' ? 'bg-lit-white' : 'bg-primary-fill-hover')}
                  />
                  <span className="mt-2.5 block text-13 text-on-night">{READING_LABEL[r.type] ?? 'Lecture'}</span>
                  <span className="tnum block text-15 font-semibold">{r.citation}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <NextLink
              href={paths.app.parole.getHref()}
              className="inline-flex min-h-12 items-center gap-2 rounded-12 bg-lit-white px-5 text-16 font-semibold text-primary-fill transition-colors hover:bg-on-night hover:text-primary-fill"
            >
              <Icon name="parole" size={20} />
              Lire la Parole du jour
            </NextLink>
          </div>
        </div>
      )}
    </section>
  );
};
