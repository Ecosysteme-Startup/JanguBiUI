'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { LiturgicalColorPill } from '@/components/signature/liturgical-banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { type LiturgyDay, useLiturgyDay } from '@/features/parole/api/get-liturgy-day';
import { DayNav } from '@/features/parole/components/day-nav';
import { ReadingSection } from '@/features/parole/components/reading-section';
import { ReadingsAside } from '@/features/parole/components/readings-aside';
import { type TextSize, TextSizeControl } from '@/features/parole/components/text-size-control';
import { calendarLine, isGospel, ISO, readingLabel } from '@/features/parole/utils/liturgy';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';
import { dayjs, longDate } from '@/utils/dates';

const defaultTab = (day: LiturgyDay) => {
  const gospel = day.readings.findIndex((r) => isGospel(r.type));
  return gospel >= 0 ? gospel : 0;
};

/** Sur mobile (MOB-Parole), une lecture à la fois : onglets ; sur desktop, toutes à la suite. */
const ReadingTabs = ({ day, active, onSelect }: { day: LiturgyDay; active: number; onSelect: (i: number) => void }) => (
  <div role="tablist" aria-label="Lectures du jour" className="-mx-4 flex gap-6 overflow-x-auto border-b border-line px-4 lg:hidden">
    {day.readings.map((r, i) => (
      <button
        key={`${r.type}-${i}`}
        type="button"
        role="tab"
        aria-selected={i === active}
        aria-controls={`lecture-${i + 1}`}
        onClick={() => onSelect(i)}
        className={cn(
          '-mb-px flex min-h-13 shrink-0 flex-col items-start justify-center border-b-2 text-left',
          i === active ? 'border-primary font-semibold text-ink' : 'border-transparent text-ink-2',
        )}
      >
        <span className="text-base">{readingLabel(r.type)}</span>
        <span className="tnum text-meta font-normal text-ink-3">{r.citation}</span>
      </button>
    ))}
  </div>
);

const LiturgyContent = ({ day, busy }: { day: LiturgyDay; busy: boolean }) => {
  const [size, setSize] = useState<TextSize>('grand');
  const [tab, setTab] = useState<number | null>(null);
  const active = tab ?? defaultTab(day);
  const translation = day.edition?.label ?? (day.source === 'aelf' ? 'Traduction liturgique AELF' : null);

  return (
    <div aria-busy={busy} className={cn(busy && 'opacity-60 transition-opacity')}>
      <div className="mt-6 flex flex-col gap-3 border-b border-t border-line border-t-line-strong py-2 lg:flex-row lg:items-center lg:justify-between">
        <p className="tnum m-0 flex flex-wrap items-center gap-3 text-meta text-ink">
          <LiturgicalColorPill color={day.calendar.color} />
          <span>{calendarLine(day.calendar)}</span>
          {translation && <span className="text-ink-3">{translation}</span>}
        </p>
        <TextSizeControl value={size} onChange={setSize} />
      </div>

      {day.audio_url && (
        <figure className="m-0 mt-6 flex flex-col gap-2">
          <figcaption className="tnum text-meta text-ink-2">Écouter les lectures</figcaption>
          {/* Pas de sous-titres fournis par l'API : le texte intégral des lectures, juste en dessous, en tient lieu. */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls preload="none" src={day.audio_url} className="w-full max-w-reading">
            Votre navigateur ne lit pas l’audio.
          </audio>
        </figure>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:mt-10 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-6 lg:col-span-8">
          {!day.readings_available || day.readings.length === 0 ? (
            <EmptyState icon="parole" title="Les lectures de ce jour ne sont pas encore en ligne.">
              <p className="m-0">
                Le calendrier liturgique est bien celui du {longDate(day.date).toLowerCase()} ; les textes seront publiés dès que
                possible. En attendant, vous pouvez ouvrir la{' '}
                <NextLink href={paths.app.bible.root.getHref()} className="text-primary underline underline-offset-4">
                  Bible
                </NextLink>
                .
              </p>
            </EmptyState>
          ) : (
            <>
              <ReadingTabs day={day} active={active} onSelect={setTab} />
              <article aria-label={`Lectures de la messe du ${longDate(day.date).toLowerCase()}`} className="flex flex-col gap-8">
                {day.readings.map((reading, i) => (
                  <ReadingSection key={`${reading.type}-${i}`} reading={reading} index={i} size={size} hiddenOnMobile={i !== active} />
                ))}
              </article>
            </>
          )}
          <p className="tnum m-0 text-meta leading-normal text-ink-3">{day.notice}</p>
        </div>
        <ReadingsAside day={day} />
      </div>
    </div>
  );
};

/** Lectures du jour (FID-Parole, MOB-Parole) : `/liturgy/today/` ou `/liturgy/{date}/`. */
export const ParoleView = ({ date }: { date?: string }) => {
  const query = useLiturgyDay(date);
  const shown = query.data?.date ?? date ?? dayjs().format(ISO);
  const today = dayjs().format(ISO);

  return (
    <div className="mx-auto max-w-[1200px]">
      <NextLink
        href={paths.app.root.getHref()}
        className="mb-6 hidden h-8 items-center gap-2 text-sm font-medium text-primary hover:text-primary-strong lg:inline-flex"
      >
        <Icon name="fleche-gauche" size={16} />
        Retour · Accueil
      </NextLink>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">01</span> — La Parole · {longDate(shown).toLowerCase()}
          </p>
          <h1 className="m-0 mt-3 font-serif text-[36px] font-normal leading-none tracking-[-0.015em] text-ink lg:text-[50px]">
            Les lectures du <em className="italic text-primary">jour</em>
          </h1>
          {shown !== today && (
            <NextLink
              href={paths.app.parole.getHref()}
              className="mt-3 inline-flex h-11 items-center text-sm text-primary underline underline-offset-4"
            >
              Revenir aux lectures d’aujourd’hui
            </NextLink>
          )}
        </div>
        <DayNav date={shown} />
      </div>

      {query.isPending ? (
        <div className="mt-10 max-w-reading">
          <LoadingBlock label="Chargement des lectures…" lines={6} />
        </div>
      ) : query.isError && !query.data ? (
        <EmptyState
          tone="err"
          icon="alerte"
          title="Impossible d’afficher les lectures."
          className="mt-10"
          action={
            <Button variant="secondary" onClick={() => query.refetch()}>
              Réessayer
            </Button>
          }
        >
          <p className="m-0">
            {query.error instanceof ApiError ? query.error.message : 'Le service ne répond pas. Réessayez dans un instant.'}
          </p>
        </EmptyState>
      ) : (
        query.data && <LiturgyContent key={query.data.date} day={query.data} busy={query.isPlaceholderData} />
      )}
    </div>
  );
};
