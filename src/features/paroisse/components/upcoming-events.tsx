'use client';

import { SectionHeading } from '@/components/ui/section-heading';

import type { ParishEvent } from '../api/get-events';

import { EventRow } from './event-row';
import { type ParishTab, TabLink } from './tab-link';

const UPCOMING = 3;

/** « Événements à venir » de l'aperçu : les trois prochains, le premier en teinte. */
export const UpcomingEvents = ({ events, onSelectTab }: { events: ParishEvent[]; onSelectTab: (tab: ParishTab) => void }) => {
  if (events.length === 0) return null;
  return (
    <section aria-labelledby="mp-evenements">
      <SectionHeading
        id="mp-evenements"
        size="md"
        title="Événements à venir"
        aside={
          <TabLink tab="agenda" onSelect={onSelectTab}>
            Agenda complet
          </TabLink>
        }
      />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {events.slice(0, UPCOMING).map((event, index) => (
          <EventRow key={event.id} event={event} highlight={index === 0} />
        ))}
      </ul>
    </section>
  );
};
