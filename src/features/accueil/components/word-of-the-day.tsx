'use client';

import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { Skeleton, SkeletonLine } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { liturgyTodayQueryOptions } from '@/hooks/use-liturgy-today';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

const READING_LABEL: Record<string, string> = {
  lecture_1: 'Première lecture',
  lecture_2: 'Deuxième lecture',
  psaume: 'Psaume',
  cantique: 'Cantique',
  evangile: 'Évangile',
};

/** Même gabarit que le contenu chargé (méta, célébration, trois lectures, bouton) : aucun décalage à l'arrivée. */
const WordOfTheDaySkeleton = () => (
  <div role="status" data-testid="parole-squelette">
    <span className="sr-only">Chargement des lectures du jour…</span>
    <SkeletonLine className="mt-5 text-meta" width="w-40" />
    <SkeletonLine className="mt-3 max-w-[560px] font-serif text-h3 lg:text-[1.6875rem] lg:leading-tight" width="w-3/4" />
    <ul aria-hidden="true" className="m-0 mt-6 grid list-none grid-cols-1 border-y border-line p-0 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className={cn('py-4', i > 0 ? 'border-t border-line sm:border-l sm:border-t-0 sm:px-4' : 'sm:pr-4')}>
          <SkeletonLine className="text-meta" width="w-24" />
          <SkeletonLine className="mt-2 text-base font-semibold" width="w-20" />
        </li>
      ))}
    </ul>
    <Skeleton className="mt-6 h-11 w-60" />
  </div>
);

/** « La Parole du jour » (FID-Accueil 01, MOB-Accueil 01) : célébration et lectures, vers /app/parole. */
export const WordOfTheDay = ({ className }: { className?: string }) => {
  const { data: day, isPending, isError } = useQuery(liturgyTodayQueryOptions());
  const gospel = day?.readings.find((r) => r.type === 'evangile');

  return (
    <section aria-labelledby="acc-parole" className={className}>
      <SectionHeading
        id="acc-parole"
        number="01"
        title="La Parole du jour"
        aside={<NextLink href={paths.app.parole.getHref()}>Lectures complètes</NextLink>}
      />
      {isPending ? (
        <WordOfTheDaySkeleton />
      ) : isError ? (
        <p className="m-0 text-base text-ink-2">Les lectures du jour n’ont pas pu être chargées.</p>
      ) : (
        <>
          {gospel && <p className="tnum m-0 mt-5 text-meta text-ink-3">Évangile · {gospel.citation}</p>}
          <p className="m-0 mt-3 max-w-[560px] font-serif text-h3 italic text-ink lg:text-[1.6875rem] lg:leading-tight">
            {frenchTypo(day.calendar.celebration)}
          </p>
          {day.readings.length > 0 && (
            <ul className="m-0 mt-6 grid list-none grid-cols-1 border-y border-line p-0 sm:grid-cols-3">
              {day.readings.map((r, i) => (
                <li key={`${r.type}-${i}`} className={cn(i > 0 && 'border-t border-line sm:border-l sm:border-t-0')}>
                  <NextLink href={paths.app.parole.getHref()} className={cn('block py-4 text-ink hover:text-primary', i > 0 ? 'sm:px-4' : 'sm:pr-4')}>
                    <span className="tnum block text-meta text-ink-3">{READING_LABEL[r.type] ?? 'Lecture'}</span>
                    <span className="mt-2 block text-base font-semibold">{r.citation}</span>
                  </NextLink>
                </li>
              ))}
            </ul>
          )}
          <NextLink href={paths.app.parole.getHref()} className={buttonVariants({ className: 'mt-6' })}>
            Lire les lectures du jour
          </NextLink>
        </>
      )}
    </section>
  );
};
