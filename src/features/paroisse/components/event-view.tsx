'use client';

import NextLink from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { useEvent } from '../api/get-event';

import { EventRegistration } from './event-registration';

const TYPE_LABEL: Record<string, string> = {
  mass: 'Messe',
  conference: 'Conférence',
  retreat: 'Retraite',
  ordination: 'Ordination',
  other: 'Événement',
};

const BackLink = () => (
  <NextLink href={paths.app.paroisse.root.getHref('agenda')} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-2 hover:text-primary">
    <Icon name="fleche-gauche" size={16} />
    Retour · Ma paroisse
  </NextLink>
);

const untilLabel = (start: string) => {
  const days = dayjs(start).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (days < 0) return 'Passé';
  if (days === 0) return 'Aujourd’hui';
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
};

/** Événement (FID-Evenement) : détail et inscription. */
export const EventView = ({ id }: { id: string }) => {
  const { data: event, isPending, isError, error } = useEvent(id);

  if (isPending) return <LoadingBlock label="Chargement de l’événement…" lines={5} />;
  if (isError) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <EmptyState tone="err" title={missing ? 'Cet événement n’existe plus.' : 'L’événement n’a pas pu être chargé.'} />
      </div>
    );
  }

  const start = dayjs(event.start_at);
  const end = dayjs(event.end_at);
  const sameDay = start.isSame(end, 'day');
  const dateLabel = sameDay ? start.format('dddd D MMMM') : `Du ${start.format('D MMMM')} au ${end.format('D MMMM')}`;
  const paragraphs = event.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-[1180px]">
      <BackLink />
      <div className="mt-6 grid gap-12 lg:grid-cols-12 lg:gap-6">
        <article aria-labelledby="ev-titre" className="lg:col-span-7">
          <p className="tnum m-0 flex justify-between gap-2 text-meta text-ink-3">
            <span>
              Agenda — {TYPE_LABEL[event.event_type] ?? 'Événement'}
              {event.node_name && ` · ${event.node_name}`}
            </span>
            <span className="text-primary">{untilLabel(event.start_at)}</span>
          </p>
          <h1 id="ev-titre" className="m-0 mt-4 font-serif text-title font-normal text-ink lg:text-h2">
            {frenchTypo(event.title)}
          </h1>
          {paragraphs.map((p, i) => (
            <p key={i} className="m-0 mt-4 max-w-reading whitespace-pre-line text-body text-ink-2">
              {frenchTypo(p)}
            </p>
          ))}
          <dl className="m-0 mt-8 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
            <div>
              <dt className="tnum text-meta text-ink-3">Date</dt>
              <dd className="m-0 mt-1 text-base font-semibold text-ink first-letter:uppercase">{dateLabel}</dd>
            </div>
            <div>
              <dt className="tnum text-meta text-ink-3">Horaires</dt>
              <dd className="tnum m-0 mt-1 text-base font-semibold text-ink">
                {hour(event.start_at)}-{hour(event.end_at)}
              </dd>
            </div>
            {event.location && (
              <div>
                <dt className="tnum text-meta text-ink-3">Lieu</dt>
                <dd className="m-0 mt-1 text-base font-semibold text-ink">{event.location}</dd>
              </div>
            )}
          </dl>
        </article>
        <div className="lg:col-span-5">
          <EventRegistration event={event} />
        </div>
      </div>
    </div>
  );
};
