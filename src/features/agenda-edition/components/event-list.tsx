'use client';

import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { plural } from '@/utils/plural';

import { EVENT_TYPE_LABELS, type StaffEvent } from '../api/staff-events';

import { clockOf } from './month-grid';

/** Vue Liste (PAR-Agenda) : carte encadrée, une rangée par événement (date en tuile, heure, titre, lieu). */
export const EventList = ({ label, events, selectedId, onSelect }: {
  label: string;
  events: StaffEvent[];
  selectedId: number | null;
  onSelect: (event: StaffEvent) => void;
}) => (
  <section aria-label={label} className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
    {events.length === 0 ? (
      <p className="m-0 px-5 py-6 text-14 text-ink-3">Aucun événement sur cette période.</p>
    ) : (
      <ol className="m-0 list-none p-0">
        {events.map((event, i) => {
          const start = dayjs(event.start_at);
          const active = selectedId === event.id;
          return (
            <li key={event.id} aria-current={active ? 'true' : undefined} className={cn(i > 0 && 'border-t border-line')}>
              <button
                type="button"
                onClick={() => onSelect(event)}
                className={cn('flex w-full items-center gap-4 px-5 py-3 text-left transition-colors', active ? 'bg-tint-50' : 'hover:bg-surface')}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-12 shrink-0 flex-col items-center justify-center rounded-12 leading-4',
                    start.day() === 0 ? 'bg-tint-50 text-tint-800' : 'bg-surface-2 text-ink-2',
                  )}
                >
                  <span className="text-12">{start.format('ddd')}</span>
                  <span className="tnum text-17 font-semibold">{start.date()}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-15 font-semibold text-ink', event.is_cancelled && 'text-ink-3 line-through')}>{frenchTypo(event.title)}</span>
                  <span className="tnum block text-13 text-ink-3">
                    {start.format('dddd D MMMM')} à {clockOf(event.start_at)} · {EVENT_TYPE_LABELS[event.event_type]}
                    {event.location && <> · {event.location}</>}
                    {event.max_participants ? <> · {event.seats_taken} / {plural(event.max_participants, 'place', 'places')}</> : null}
                    {event.is_cancelled && <> · annulé</>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    )}
  </section>
);
