'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';

import { useEvents } from '../api/get-events';

import { EventRow } from './event-row';

/** Onglet « Agenda » : tous les événements à venir de la paroisse. */
export const AgendaSection = ({ nodeId }: { nodeId: string }) => {
  const { data, isPending, isError } = useEvents(nodeId);
  const events = data?.results ?? [];

  return (
    <section id="agenda" aria-labelledby="mp-agenda">
      <SectionHeading id="mp-agenda" size="md" title="Agenda" />
      {isPending ? (
        <LoadingBlock label="Chargement de l’agenda…" />
      ) : isError ? (
        <EmptyState tone="err" title="L’agenda n’a pas pu être chargé." />
      ) : events.length === 0 ? (
        <EmptyState icon="calendrier" title="Aucun événement à venir.">
          Les rencontres, retraites et célébrations de la paroisse apparaîtront ici.
        </EmptyState>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {events.map((event, index) => (
            <EventRow key={event.id} event={event} highlight={index === 0} />
          ))}
        </ul>
      )}
    </section>
  );
};
