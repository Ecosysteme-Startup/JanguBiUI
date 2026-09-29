'use client';

import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { usePublicEvents } from '../api/get-public-events';

/** « Agenda » de la fiche : prochains événements publics de la paroisse (absent de la maquette, conservé). */
export const ParishEvents = ({ nodeId }: { nodeId: string }) => {
  const { data, isError } = usePublicEvents(nodeId, 4);
  const events = (data?.results ?? []).filter((e) => !e.is_cancelled);
  return (
    <section aria-labelledby="h-agenda" className="rounded-16 border border-line bg-paper p-6 shadow-card">
      <h2 id="h-agenda" className="m-0 text-17 font-semibold text-ink">
        Prochains événements
      </h2>
      {isError ? (
        <p role="alert" className="m-0 mt-3 text-14 text-err">
          L&apos;agenda n&apos;a pas pu être chargé.
        </p>
      ) : data && events.length === 0 ? (
        <p className="m-0 mt-3 text-14 text-ink-2">Aucun événement public annoncé.</p>
      ) : (
        <ol className="m-0 mt-2 list-none p-0">
          {events.map((event, index) => (
            <li key={event.id} className={cn('flex gap-4 py-3', index < events.length - 1 ? 'border-b border-line' : 'pb-0')}>
              <span className="tnum flex w-10 shrink-0 flex-col items-center rounded-10 bg-tint-50 py-1 text-tint-800">
                <span className="text-17 font-semibold">{dayjs(event.start_at).format('D')}</span>
                <span className="text-12">{dayjs(event.start_at).format('MMM')}</span>
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-15 font-semibold text-ink">{frenchTypo(event.title)}</span>
                <span className="text-13 text-ink-2">{[hour(event.start_at), event.location].filter(Boolean).join(' · ')}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
