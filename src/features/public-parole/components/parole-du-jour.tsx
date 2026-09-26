'use client';

import NextLink from 'next/link';
import { useEffect, useState } from 'react';

import { Ordinals } from '@/components/signature/liturgical-banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';
import { dayjs, longDate } from '@/utils/dates';

import { type LiturgyDayFull, useLiturgyDay } from '../api/get-liturgy-day';
import { nextSunday } from '../utils/days';
import { type ReadingTab, readingTabs, readingTitle, shortCitation } from '../utils/readings';

import { ColorTag } from './color-tag';
import { DayPicker } from './day-picker';
import { MonthCalendar } from './month-calendar';
import { ReadingsList } from './readings-list';
import { ShareActions } from './share-actions';
import { WeekStrip } from './week-strip';

type TabKey = ReadingTab['key'];
const TAB_KEYS: TabKey[] = ['lectures', 'psaume', 'evangile'];

/** Onglet demandé par l'ancre de l'URL (`#psaume`), lu au navigateur. */
const useHashTab = (): [TabKey | null, (key: TabKey) => void] => {
  const [tab, setTab] = useState<TabKey | null>(null);
  useEffect(() => {
    const read = () => {
      const hash = window.location.hash.slice(1) as TabKey;
      setTab(TAB_KEYS.includes(hash) ? hash : null);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  const select = (key: TabKey) => {
    setTab(key);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${key}`);
  };
  return [tab, select];
};

/** « Dimanche 27 sept., 26e dimanche du temps ordinaire ». */
const SundayValue = ({ from }: { from: string }) => {
  const sunday = nextSunday(from);
  const { data } = useLiturgyDay(sunday);
  return (
    <NextLink href={paths.parole.getHref(sunday)} className="text-ink hover:text-primary">
      {dayjs(sunday).format('D MMM')}
      {data && (
        <>
          , <Ordinals text={data.calendar.celebration} />
        </>
      )}
    </NextLink>
  );
};

/** Carte du jour liturgique (colonne latérale) : couleur, célébration, année, lectures, dimanche. */
const DayCard = ({ data }: { data: LiturgyDayFull }) => {
  const { calendar } = data;
  const year = [
    calendar.weekday_cycle ? `Année ${calendar.weekday_cycle === 'II' ? 'paire' : 'impaire'}` : null,
    calendar.sunday_cycle ? `cycle ${calendar.sunday_cycle}` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const citations = data.readings.filter((r) => !/acclamation/i.test(r.type)).map((r) => shortCitation(r.citation));
  return (
    <section aria-labelledby="jour-titre" className="rounded-16 border border-line bg-surface p-6">
      <ColorTag color={calendar.color} className="bg-paper" />
      <h2 id="jour-titre" className="m-0 mt-3 text-20 font-semibold text-ink">
        <Ordinals text={calendar.celebration} />
      </h2>
      <dl className="m-0 mt-4 grid grid-cols-[96px_minmax(0,1fr)] gap-y-2 text-14">
        {year && (
          <>
            <dt className="text-ink-3">Année</dt>
            <dd className="m-0 text-ink">{year.charAt(0).toUpperCase() + year.slice(1)}</dd>
          </>
        )}
        {citations.length > 0 && (
          <>
            <dt className="text-ink-3">Lectures</dt>
            <dd className="tnum m-0 text-ink">{citations.join(' · ')}</dd>
          </>
        )}
        <dt className="text-ink-3">Dimanche</dt>
        <dd className="m-0">
          <SundayValue from={data.date} />
        </dd>
      </dl>
    </section>
  );
};

/** Lectures du jour, en trois onglets (Lectures, Psaume, Évangile), et l'onglet suivant en bas. */
const ReadingTabs = ({ data }: { data: LiturgyDayFull }) => {
  const tabs = readingTabs(data.readings);
  const [hashTab, select] = useHashTab();
  const active = tabs.find((t) => t.key === hashTab)?.key ?? tabs[0]?.key ?? 'lectures';
  const next = tabs[tabs.findIndex((t) => t.key === active) + 1];

  return (
    <Tabs value={active} onValueChange={(value) => select(value as TabKey)}>
      <TabsList size="lg" aria-label="Textes du jour">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, index) => (
        // Tous les textes restent dans la page (recherche, référencement) ; seul l'onglet actif est visible.
        <TabsContent key={tab.key} value={tab.key} forceMount className="mt-8 flex flex-col gap-12 data-[state=inactive]:hidden">
          <ReadingsList readings={tab.readings} offset={tabs.slice(0, index).reduce((n, t) => n + t.readings.length, 0)} />
        </TabsContent>
      ))}
      <p className="m-0 mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-line pt-4 text-13 text-ink-3">
        <span>{data.notice || 'Textes liturgiques du jour.'}</span>
        <NextLink href={paths.auth.inscription.getHref()} className="font-semibold">
          Recevoir la Parole chaque matin
        </NextLink>
      </p>
      {next && (
        <button
          type="button"
          onClick={() => {
            select(next.key);
            document.getElementById('parole-textes')?.scrollIntoView?.({ block: 'start' });
          }}
          className="mt-8 flex w-full items-center gap-4 rounded-16 border border-line bg-paper px-6 py-5 text-left text-ink shadow-card transition-colors hover:border-line-active"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-13 text-ink-3">Ensuite</span>
            <span className="block text-17 font-semibold">{next.readings[0] ? readingTitle(next.readings[0]) : next.label}</span>
          </span>
          <Icon name="chevron-droite" size={20} className="shrink-0 text-ink-3" />
        </button>
      )}
    </Tabs>
  );
};

/**
 * Parole du jour publique (WEB-Parole-du-jour) : date dans l'URL, bande de la semaine, lectures
 * en onglets, et en colonne le jour liturgique, le partage et le calendrier du mois. Mention de
 * droits (`notice`) toujours affichée ; `readings_available` à faux : le calendrier reste.
 */
export const ParoleDuJour = ({ date }: { date?: string }) => {
  const { data, isPending, isError, error } = useLiturgyDay(date);
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(dayjs().format('YYYY-MM-DD')), []);

  if (isPending) {
    return (
      <div className="jb-container pb-24 pt-12">
        <LoadingBlock label="Chargement des lectures du jour…" lines={6} />
      </div>
    );
  }
  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="jb-container pb-24 pt-12">
        <h1 className="m-0 mb-8 text-40 font-semibold text-ink">La Parole du jour</h1>
        <EmptyState
          tone="err"
          icon="alerte"
          title={notFound ? 'Aucune liturgie pour cette date.' : 'Les lectures n’ont pas pu être chargées.'}
          action={
            <Button asChild variant="secondary">
              <NextLink href={paths.parole.getHref()}>Revenir à aujourd&apos;hui</NextLink>
            </Button>
          }
        >
          {notFound ? 'Vérifiez la date demandée.' : 'Le service ne répond pas. Réessayez dans un instant.'}
        </EmptyState>
      </div>
    );
  }

  const current = data.date;
  const hasReadings = data.readings_available && data.readings.length > 0;

  return (
    <div className="jb-container pb-24 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h1 className="m-0 text-32 font-semibold text-ink md:text-40">La Parole du jour</h1>
          <p className="m-0 mt-2 text-18 text-ink-2">{longDate(current)}</p>
        </div>
        <DayPicker value={current} isToday={today === null || current === today} />
      </div>
      <WeekStrip current={current} today={today} />

      <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-16 xl:grid-cols-[680px_minmax(0,1fr)] xl:gap-24">
        <article id="parole-textes" aria-label="Textes du jour" className="min-w-0 scroll-mt-6">
          {hasReadings ? (
            <ReadingTabs data={data} />
          ) : (
            <>
              <EmptyState icon="calendrier" title="Les lectures de ce jour ne sont pas encore disponibles.">
                Le calendrier liturgique est à jour ; les textes seront publiés dès leur réception. Revenez un peu plus tard.
              </EmptyState>
              {data.notice && <p className="m-0 mt-8 border-t border-line pt-4 text-13 text-ink-3">{data.notice}</p>}
            </>
          )}
        </article>
        <aside aria-label="Jour liturgique, partage et calendrier" className={cn('flex flex-col gap-6')}>
          <DayCard data={data} />
          <ShareActions title={`La Parole du jour · ${longDate(current)}`} path={paths.parole.getHref(current)} />
          <MonthCalendar current={current} />
        </aside>
      </div>
    </div>
  );
};
