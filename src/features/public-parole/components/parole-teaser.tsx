'use client';

import NextLink from 'next/link';

import { LiturgicalColorPill, Ordinals } from '@/components/signature/liturgical-banner';
import { Icon } from '@/components/ui/icon';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { useLiturgyDay } from '../api/get-liturgy-day';
import { nextSunday } from '../utils/days';
import { readingExcerpt, readingLabel } from '../utils/readings';

const SundayLine = ({ from }: { from: string }) => {
  const sunday = nextSunday(from);
  const { data } = useLiturgyDay(sunday);
  if (!data) return null;
  return (
    <span className="text-sm text-ink-3">
      {dayjs(sunday).format('dddd D MMMM').replace(/^./, (c) => c.toUpperCase())} : <Ordinals text={data.calendar.celebration} />
    </span>
  );
};

/** Section « I — La Parole du jour » de l'accueil public. */
export const ParoleTeaser = () => {
  const { data, isPending, isError } = useLiturgyDay();
  const first = data?.readings[0];
  const excerpt = first ? readingExcerpt(first) : null;

  return (
    <section aria-labelledby="parole-titre" className="flex flex-col gap-6">
      <SectionHeading id="parole-titre" number="I" title="La Parole du jour" aside={data?.notice || undefined} className="mb-0" />
      {isPending ? (
        <LoadingBlock label="Chargement de la Parole du jour…" />
      ) : isError || !data ? (
        <p className="m-0 text-base text-ink-2">
          La Parole du jour n&apos;a pas pu être chargée.{' '}
          <NextLink href={paths.parole.getHref()} className="text-primary underline">
            Ouvrir la page des lectures
          </NextLink>
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 border border-line bg-surface p-6 md:p-12 lg:grid-cols-12">
          <div className="flex flex-col justify-between lg:col-span-8 lg:pr-8">
            <p className="tnum m-0 flex flex-wrap items-center gap-4 text-meta text-ink-3">
              <span>
                {dayjs(data.date).format('dddd D MMMM').replace(/^./, (c) => c.toUpperCase())}
                {first && ` · ${readingLabel(first.type)}`}
              </span>
              <LiturgicalColorPill color={data.calendar.color} />
            </p>
            {excerpt && first ? (
              <blockquote className="m-0 mt-8 p-0">
                <p className="m-0 font-serif text-h3 italic leading-[1.1] text-ink md:text-title">
                  {excerpt.verse && <span className="tnum mr-3 align-top font-sans text-xs not-italic text-primary">{excerpt.verse}</span>}
                  {frenchTypo(`« ${excerpt.text} »`)}
                </p>
                <footer className="tnum mt-6 text-xs text-ink-2">{first.citation}</footer>
              </blockquote>
            ) : (
              <p className="m-0 mt-8 font-serif text-title text-ink">
                <Ordinals text={data.calendar.celebration} />
              </p>
            )}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-4">
              <NextLink
                href={paths.parole.getHref()}
                className="hit inline-flex items-center gap-2 text-base font-medium text-primary underline decoration-1 underline-offset-[5px]"
              >
                Lire les lectures du jour
                <Icon name="fleche-droite" size={16} />
              </NextLink>
              <SundayLine from={data.date} />
            </div>
          </div>
          <div className="flex flex-col border-line lg:col-span-4 lg:border-l lg:pl-6">
            <p className="tnum m-0 text-meta text-ink-3">Les lectures de ce jour</p>
            {data.readings_available && data.readings.length > 0 ? (
              <ol className="m-0 mt-4 list-none p-0">
                {data.readings.map((reading, index) => {
                  const quote = readingExcerpt(reading, 70);
                  return (
                    <li key={`${reading.type}-${index}`} className={index === 0 ? 'border-t border-ink py-4' : 'border-t border-line py-4'}>
                      <span className="tnum block text-meta text-ink-3">{readingLabel(reading.type)}</span>
                      <span className="mt-1.5 block font-serif text-h3">{reading.citation}</span>
                      {quote && <span className="mt-1.5 block text-base text-ink-2">{frenchTypo(`« ${quote.text} »`)}</span>}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="m-0 mt-4 text-base text-ink-2">Les lectures de ce jour ne sont pas encore publiées.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
