'use client';

import { SectionHeading } from '@/components/ui/section-heading';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { usePublicEvents } from '../api/get-public-events';

/** « 05 — Prochains événements » : agenda public de la paroisse. */
export const ParishEvents = ({ nodeId }: { nodeId: string }) => {
  const { data, isError } = usePublicEvents(nodeId, 4);
  const events = (data?.results ?? []).filter((e) => !e.is_cancelled);
  return (
    <section aria-labelledby="h-agenda">
      <SectionHeading id="h-agenda" number="05" title="Prochains événements" />
      {isError ? (
        <p role="alert" className="m-0 mt-2 text-sm text-err">
          L&apos;agenda n&apos;a pas pu être chargé.
        </p>
      ) : data && events.length === 0 ? (
        <p className="m-0 mt-2 text-sm text-ink-2">Aucun événement public annoncé.</p>
      ) : (
        <ol className="m-0 list-none p-0">
          {events.map((event) => (
            <li key={event.id} className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 border-b border-line py-3">
              <span className="flex flex-col">
                <span className="tnum font-serif text-h3 leading-none text-ink">{dayjs(event.start_at).format('DD')}</span>
                <span className="tnum mt-1 text-meta text-ink-3">{dayjs(event.start_at).format('MMM')}</span>
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-medium text-ink">{frenchTypo(event.title)}</span>
                <span className="text-sm text-ink-3">{[hour(event.start_at), event.location].filter(Boolean).join(' · ')}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
