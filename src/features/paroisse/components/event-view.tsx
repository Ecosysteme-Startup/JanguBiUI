'use client';

import NextLink from 'next/link';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { parishLabel } from '@/utils/parish-name';

import { useEvent } from '../api/get-event';
import { type ParishEvent, useEvents } from '../api/get-events';
import { downloadIcs } from '../utils/ics';

import { BackLink } from './back-link';
import { EventRegistration } from './event-registration';
import { ShareIconButton } from './share-button';

const TYPE_LABEL: Record<string, string> = {
  mass: 'Liturgie',
  conference: 'Conférence',
  retreat: 'Retraite',
  ordination: 'Ordination',
  other: 'Événement',
};

const AGENDA = paths.app.paroisse.root.getHref('agenda');
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const untilLabel = (start: string) => {
  const days = dayjs(start).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (days < 0) return 'Passé';
  if (days === 0) return 'Aujourd’hui';
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
};

const Crumbs = ({ title }: { title?: string }) => (
  <TopbarContent
    start={
      <Breadcrumbs
        items={[
          { label: 'Ma paroisse', href: paths.app.paroisse.root.getHref() },
          { label: 'Agenda', href: AGENDA },
          ...(title ? [{ label: title }] : []),
        ]}
      />
    }
  />
);

/** Pavé de date 72 px : mois sur bandeau b100, jour 28, jour de semaine. */
const DateBlock = ({ date }: { date: string }) => {
  const d = dayjs(date);
  return (
    <span aria-hidden="true" className="tnum w-18 shrink-0 overflow-hidden rounded-14 border border-line-active text-center">
      <span className="block h-6 bg-tint-100 text-13 font-semibold leading-6 text-tint-800">{d.format('MMM')}</span>
      <span className="block bg-paper pb-1.5 pt-1">
        <span className="block text-28 font-semibold leading-[34px] text-ink">{d.format('D')}</span>
        <span className="block text-13 leading-4 text-ink-3">{d.format('ddd')}</span>
      </span>
    </span>
  );
};

const InfoRow = ({ icon, title, children, last = false }: { icon: IconName; title: React.ReactNode; children?: React.ReactNode; last?: boolean }) => (
  <div className={cn('flex gap-4 px-6 py-4', !last && 'border-b border-line')}>
    <Icon name={icon} size={20} className="mt-0.5 shrink-0 text-ink-3" />
    <span className="flex min-w-0 flex-col">
      <span className="text-16 font-semibold text-ink">{title}</span>
      {children && <span className="text-14 text-ink-2">{children}</span>}
    </span>
  </div>
);

const directionsHref = (location: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;

/** « Autres événements » : les prochains de la même paroisse, en rangées compactes. */
const OtherEvents = ({ event }: { event: ParishEvent }) => {
  const { data } = useEvents(event.node_id);
  const others = (data?.results ?? []).filter((e) => e.id !== event.id && !e.is_cancelled).slice(0, 3);
  if (others.length === 0) return null;
  return (
    <section aria-labelledby="ev-autres">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="ev-autres" className="m-0 text-18 font-semibold text-ink">
          Autres événements
        </h2>
        <NextLink href={AGENDA} className="text-14 font-medium">
          Agenda
        </NextLink>
      </div>
      <ul className="m-0 mt-3 list-none overflow-hidden rounded-16 border border-line bg-paper p-0">
        {others.map((e, i) => {
          const start = dayjs(e.start_at);
          return (
            <li key={e.id} className={cn(i < others.length - 1 && 'border-b border-line')}>
              <NextLink
                href={paths.app.paroisse.evenement.getHref(e.id)}
                className="flex items-center gap-3 px-4 py-3 text-ink hover:bg-surface hover:text-ink hover:no-underline"
              >
                <span aria-hidden="true" className="flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-10 border border-line bg-surface">
                  <span className="text-11 leading-[14px] text-ink-3">{start.format('MMM')}</span>
                  <span className="tnum text-17 font-semibold leading-[22px]">{start.format('D')}</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-15 font-semibold">
                    <span className="sr-only">{start.format('dddd D MMMM')} : </span>
                    {frenchTypo(e.title)}
                  </span>
                  <span className="text-13 text-ink-3">{[`${capitalize(start.format('dddd'))}, ${hour(e.start_at)}`, e.location].filter(Boolean).join(' · ')}</span>
                </span>
              </NextLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/** Événement (FID-Evenement) : date, horaires, lieu, calendrier, itinéraire, inscription, autres événements. */
export const EventView = ({ id }: { id: string }) => {
  const { data: event, isPending, isError, error } = useEvent(id);

  if (isPending)
    return (
      <>
        <Crumbs />
        <LoadingBlock label="Chargement de l’événement…" lines={5} />
      </>
    );
  if (isError) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col gap-6">
        <Crumbs />
        <BackLink href={AGENDA}>Agenda de la paroisse</BackLink>
        <EmptyState tone="err" title={missing ? 'Cet événement n’existe plus.' : 'L’événement n’a pas pu être chargé.'} />
      </div>
    );
  }

  const start = dayjs(event.start_at);
  const end = dayjs(event.end_at);
  const sameDay = start.isSame(end, 'day');
  const dateLabel = sameDay ? capitalize(start.format('dddd D MMMM YYYY')) : `Du ${start.format('dddd D MMMM')} au ${end.format('dddd D MMMM YYYY')}`;
  const timeLabel = sameDay ? `${hour(event.start_at)} - ${hour(event.end_at)}` : `De ${hour(event.start_at)} à ${hour(event.end_at)}`;
  const paragraphs = event.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const ended = end.isBefore(dayjs());
  // Une seule action primaire : l'inscription quand elle est possible, sinon l'ajout au calendrier.
  const registering = event.registrations_open && !event.is_registered && !event.is_cancelled && !event.is_full && !ended;

  return (
    <div>
      <Crumbs title={event.title} />
      <BackLink href={AGENDA}>Agenda de la paroisse</BackLink>
      <div className="mt-6 flex items-start gap-4 sm:gap-6">
        <DateBlock date={event.start_at} />
        <div className="min-w-0 flex-1">
          <span className="inline-flex h-[26px] items-center rounded-full bg-tint-50 px-2.5 text-13 font-medium text-tint-800">
            {TYPE_LABEL[event.event_type] ?? 'Événement'}
          </span>
          <h1 id="ev-titre" className="m-0 mt-2 text-24 font-semibold text-ink sm:text-32">
            {frenchTypo(event.title)}
          </h1>
          <p className="m-0 mt-2 text-16 text-ink-2">
            {event.node_name && `${parishLabel(event.node_name)} · `}
            <span className={cn(event.is_cancelled && 'font-semibold text-err')}>{event.is_cancelled ? 'Annulé' : untilLabel(event.start_at)}</span>
          </p>
        </div>
      </div>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_336px]">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
            <InfoRow icon="calendrier" title={dateLabel} />
            <InfoRow icon="horloge" title={<span className="tnum">{timeLabel}</span>} last={!event.location} />
            {event.location && <InfoRow icon="pin" title={event.location} last />}
          </div>
          {!event.is_cancelled && !ended && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="lg" variant={registering ? 'outline' : 'primary'} onClick={() => downloadIcs(event)}>
                <Icon name="calendrier-ok" size={20} />
                Ajouter au calendrier
              </Button>
              {event.location && (
                <a
                  href={directionsHref(event.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hit inline-flex min-h-12 items-center gap-2 rounded-12 border border-line bg-paper px-[18px] text-16 font-semibold text-ink hover:border-line-field hover:bg-surface hover:text-ink hover:no-underline"
                >
                  <Icon name="itineraire" size={20} />
                  Itinéraire
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              )}
              <ShareIconButton title={event.title} label="Partager l’événement" bordered />
            </div>
          )}
          {paragraphs.length > 0 && (
            <section aria-labelledby="ev-propos" className="mt-10">
              <h2 id="ev-propos" className="m-0 text-20 font-semibold text-ink">
                À propos
              </h2>
              <div className="mt-3 text-17 leading-7 text-ink">
                {paragraphs.map((p, i) => (
                  <p key={i} className={cn('m-0 whitespace-pre-line', i > 0 && 'mt-4')}>
                    {frenchTypo(p)}
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside aria-label="Inscription et autres événements" className="flex min-w-0 flex-col gap-6">
          <EventRegistration event={event} />
          <OtherEvents event={event} />
        </aside>
      </div>
    </div>
  );
};
