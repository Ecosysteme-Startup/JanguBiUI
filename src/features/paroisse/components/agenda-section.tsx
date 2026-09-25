'use client';

import NextLink from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { useEvents } from '../api/get-events';

/** Agenda : événements à venir de la paroisse. */
export const AgendaSection = ({ nodeId, className }: { nodeId: string; className?: string }) => {
  const { data, isPending, isError } = useEvents(nodeId);
  const events = data?.results ?? [];

  return (
    <section id="agenda" aria-labelledby="mp-agenda" className={cn('scroll-mt-24', className)}>
      <SectionHeading id="mp-agenda" number="03" title="Agenda" />
      {isPending ? (
        <LoadingBlock label="Chargement de l’agenda…" />
      ) : isError ? (
        <EmptyState tone="err" title="L’agenda n’a pas pu être chargé." />
      ) : events.length === 0 ? (
        <EmptyState icon="calendrier" title="Aucun événement à venir.">
          Les rencontres, retraites et célébrations de la paroisse apparaîtront ici.
        </EmptyState>
      ) : (
        <ol className="m-0 list-none p-0">
          {events.map((event) => {
            const start = dayjs(event.start_at);
            return (
              <li key={event.id} className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 border-b border-line py-4">
                <span className="tnum flex flex-col text-ink" aria-hidden="true">
                  <span className="text-meta text-ink-3">{start.format('ddd')}</span>
                  <span className="font-serif text-h3 leading-none">{start.format('D')}</span>
                </span>
                <span className="flex flex-col">
                  <NextLink href={paths.app.paroisse.evenement.getHref(event.id)} className="font-serif text-h4 text-ink hover:text-primary">
                    <span className="sr-only">{start.format('dddd D MMMM')} : </span>
                    {frenchTypo(event.title)}
                  </NextLink>
                  <span className="mt-1 text-sm text-ink-2">
                    {[hour(event.start_at), event.location].filter(Boolean).join(' · ')}
                    {event.is_cancelled && <span className="font-medium text-err"> · annulé</span>}
                    {event.is_registered && !event.is_cancelled && <span className="font-medium text-primary"> · vous êtes inscrit(e)</span>}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
