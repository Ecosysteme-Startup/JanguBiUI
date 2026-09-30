'use client';

import NextLink from 'next/link';

import { Ordinals } from '@/components/signature/liturgical-banner';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { Reveal, Stagger, StaggerItem } from '@/lib/motion/reveal';
import { cn } from '@/utils/cn';
import { longDate } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type Reading, useLiturgyDay } from '../api/get-liturgy-day';
import { findReading, readingExcerpt, readingLabel, readingTabKey, readingTitle } from '../utils/readings';

import { colorLabel, ColorTag } from './color-tag';

/** « Temps ordinaire, couleur verte ». */
const FEMININE: Record<string, string> = { vert: 'verte', blanc: 'blanche', violet: 'violette', rouge: 'rouge', rose: 'rose' };
const seasonAndColor = (season: string, color: string) => `${season}, couleur ${FEMININE[color] ?? colorLabel(color).toLowerCase()}`;

const ReadingRow = ({ reading, last }: { reading: Reading; last: boolean }) => {
  const excerpt = readingExcerpt(reading, 120);
  return (
    <NextLink
      href={`${paths.parole.getHref()}#${readingTabKey(reading)}`}
      className={cn('group flex items-center gap-4 px-6 py-6 text-ink transition-colors hover:bg-surface hover:text-ink md:px-8 md:py-7', !last && 'border-b border-line')}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-13 text-ink-3">{readingLabel(reading.type)}</span>
        <span className="mt-0.5 block text-17 font-semibold">{readingTitle(reading)}</span>
        {excerpt && <span className="mt-1.5 block font-serif text-17 leading-[26px] text-ink-2">{frenchTypo(excerpt.text)}</span>}
      </span>
      <Icon name="chevron-droite" size={20} className="shrink-0 text-ink-3 transition-transform duration-150 motion-safe:group-hover:translate-x-0.5" />
    </NextLink>
  );
};

/**
 * Bande « La Parole du jour » de l'accueil (WEB-Accueil) : parole de l'Évangile à gauche,
 * première lecture, psaume et Évangile à droite, chacun menant à sa lecture.
 */
export const ParoleTodaySection = () => {
  const { data, isPending, isError } = useLiturgyDay();
  const gospel = data ? findReading(data.readings, 'evangile') : undefined;
  const quote = gospel ? readingExcerpt(gospel, 140) : null;
  const rows = data
    ? (['lecture', 'psaume', 'evangile'] as const)
        .map((kind) => findReading(data.readings, kind))
        .filter((reading): reading is Reading => Boolean(reading))
    : [];

  return (
    <section aria-labelledby="parole-titre" className="border-y border-line bg-surface">
      <div className="jb-container py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <h2 id="parole-titre" className="m-0 text-28 font-semibold text-ink md:text-32">
              La Parole du jour
            </h2>
            {data && (
              <p className="m-0 mt-2 text-18 text-ink-2">
                {longDate(data.date)}, <Ordinals text={data.calendar.celebration.charAt(0).toLowerCase() + data.calendar.celebration.slice(1)} />.
              </p>
            )}
          </div>
          <NextLink href={paths.parole.getHref()} className="hit whitespace-nowrap text-16 font-semibold">
            Toutes les lectures
          </NextLink>
        </div>

        {isPending ? (
          <div className="mt-10">
            <LoadingBlock label="Chargement de la Parole du jour…" />
          </div>
        ) : isError || !data ? (
          <p className="m-0 mt-10 text-16 text-ink-2">
            La Parole du jour n&apos;a pas pu être chargée.{' '}
            <NextLink href={paths.parole.getHref()} className="font-semibold">
              Ouvrir la page des lectures
            </NextLink>
          </p>
        ) : (
          <Reveal className="mt-10 grid grid-cols-1 overflow-hidden rounded-16 border border-line bg-paper shadow-card lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="flex flex-col border-b border-line p-6 md:p-12 lg:border-b-0 lg:border-r">
              <ColorTag color={data.calendar.color}>{seasonAndColor(data.calendar.season_label, data.calendar.color)}</ColorTag>
              {quote && gospel ? (
                <>
                  <p className="m-0 mt-6 font-serif text-24 text-ink md:text-30">
                    « {frenchTypo(quote.text)} »
                  </p>
                  <span className="mt-4 text-15 text-ink-3">{readingTitle(gospel)}</span>
                </>
              ) : (
                <p className="m-0 mt-6 text-16 text-ink-2">
                  {data.readings_available ? 'Les textes du jour sont disponibles dans la page des lectures.' : 'Les lectures de ce jour ne sont pas encore publiées.'}
                </p>
              )}
              <div className="min-h-8 flex-1" />
              <div className="flex flex-wrap items-center gap-3">
                <NextLink href={paths.parole.getHref()} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 px-[18px]')}>
                  Lire les lectures
                </NextLink>
              </div>
            </div>
            {rows.length > 0 && (
              <Stagger className="flex flex-col" delay={0.14}>
                {rows.map((reading, index) => (
                  <StaggerItem key={`${reading.type}-${index}`}>
                    <ReadingRow reading={reading} last={index === rows.length - 1} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
};
