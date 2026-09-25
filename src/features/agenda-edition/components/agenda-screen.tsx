'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type StaffEvent, useStaffEvents } from '../api/staff-events';
import { inMonth, monthTitle, monthWeeks, onDay } from '../utils/calendar';

import { EventDetail } from './event-detail';
import { EventForm } from './event-form';

const DAYS = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

type View = 'mois' | 'liste';
type Editing = { event: StaffEvent | null; day: string | null } | null;

const MonthGrid = ({
  month,
  events,
  selectedId,
  onSelect,
}: {
  month: dayjs.Dayjs;
  events: StaffEvent[];
  selectedId: number | null;
  onSelect: (event: StaffEvent) => void;
}) => {
  const today = dayjs().format('YYYY-MM-DD');
  return (
    <section aria-label={`${monthTitle(month)}, vue mois`} className="mt-6">
      <div className="grid grid-cols-7 border-b border-line-strong" aria-hidden="true">
        {DAYS.map((d) => (
          <span key={d} className="tnum px-2 pb-2 text-meta text-ink-3">
            {d}
          </span>
        ))}
      </div>
      {monthWeeks(month).map((week) => (
        <div key={week[0]} className="grid grid-cols-7">
          {week.map((day) => {
            const d = dayjs(day);
            const outside = !d.isSame(month, 'month');
            const dayEvents = events.filter((e) => onDay(e, day));
            return (
              <div
                key={day}
                aria-label={d.format('dddd D MMMM')}
                role="group"
                className={cn('min-h-24 border-b border-r border-line p-1.5 first:border-l', outside && 'bg-surface', day === today && 'bg-tint-50')}
              >
                <span className={cn('tnum block px-1 text-meta', outside ? 'text-ink-3' : 'text-ink-2', day === today && 'font-semibold text-primary')}>
                  {d.date() === 1 ? '1er' : d.date()}
                </span>
                <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
                  {dayEvents.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(event)}
                        aria-pressed={selectedId === event.id}
                        className={cn(
                          'w-full truncate rounded px-1 py-0.5 text-left text-xs transition-colors',
                          selectedId === event.id ? 'bg-ink text-paper' : 'text-ink hover:bg-surface-2',
                          event.is_cancelled && 'text-ink-3 line-through',
                        )}
                      >
                        <span className="tnum">{hour(event.start_at)}</span> {event.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
};

const MonthList = ({ events, selectedId, onSelect }: { events: StaffEvent[]; selectedId: number | null; onSelect: (event: StaffEvent) => void }) => (
  <section aria-labelledby="ag-liste" className="mt-10">
    <h2 id="ag-liste" className="tnum m-0 border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
      <span className="text-primary">04</span> — Ce mois-ci
    </h2>
    {events.length === 0 ? (
      <p className="m-0 mt-3 text-sm text-ink-3">Aucun événement ce mois-ci.</p>
    ) : (
      <ol className="m-0 mt-2 list-none p-0">
        {events.map((event) => {
          const start = dayjs(event.start_at);
          return (
            <li key={event.id} aria-current={selectedId === event.id ? 'true' : undefined} className={cn('border-b border-line', selectedId === event.id && 'bg-tint-50')}>
              <button type="button" onClick={() => onSelect(event)} className="flex w-full items-baseline gap-4 py-3 text-left">
                <span className="tnum w-8 font-serif text-h4 text-ink">{start.format('DD')}</span>
                <span className="tnum w-10 text-meta text-ink-3">{start.format('ddd')}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-base font-medium text-ink', event.is_cancelled && 'text-ink-3 line-through')}>{frenchTypo(event.title)}</span>
                  <span className="block text-sm text-ink-3">
                    {hour(event.start_at)}
                    {event.location && <> · {event.location}</>}
                    {event.max_participants ? <> · {event.registrations_count} / {event.max_participants} inscrits</> : null}
                    {event.is_cancelled && <> · annulé</>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    )}
    <p className="m-0 mt-3 text-sm text-ink-3">Les événements apparaissent dans « Ma paroisse » pour les fidèles qui suivent la paroisse.</p>
  </section>
);

/** PAR-Agenda : calendrier du mois, liste, détail d'un événement, création et modification. */
export const AgendaScreen = ({ nodeId }: { nodeId: string }) => {
  const [month, setMonth] = useState(() => dayjs().startOf('month'));
  const [view, setView] = useState<View>('mois');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  // Le serveur ne filtre pas par dates : les mois passés demandent aussi les événements terminés.
  const includePast = month.isBefore(dayjs().startOf('month'));
  const events = useStaffEvents(nodeId, includePast);
  const places = useBackofficePlaces(nodeId);

  const monthEvents = (events.data?.results ?? []).filter((e) => inMonth(e, month));
  const selected = monthEvents.find((e) => e.id === selectedId) ?? null;
  const prev = month.subtract(1, 'month');
  const next = month.add(1, 'month');
  const go = (target: dayjs.Dayjs) => {
    setMonth(target);
    setSelectedId(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="tnum m-0 text-meta text-ink-2" aria-live="polite">
            <span className="text-primary">03</span> — Agenda
            {events.data && (
              <>
                {' '}
                · {monthEvents.length} événement{monthEvents.length > 1 ? 's' : ''} en {month.format('MMMM')}
              </>
            )}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="m-0 font-serif text-title font-normal text-ink">{monthTitle(month)}</h1>
            <button type="button" aria-label={`Mois précédent : ${prev.format('MMMM')}`} onClick={() => go(prev)} className="hit inline-flex size-10 items-center justify-center rounded border border-line hover:bg-surface-2">
              <Icon name="chevron-gauche" size={18} />
            </button>
            <button type="button" aria-label={`Mois suivant : ${next.format('MMMM')}`} onClick={() => go(next)} className="hit inline-flex size-10 items-center justify-center rounded border border-line hover:bg-surface-2">
              <Icon name="chevron-droite" size={18} />
            </button>
            <Button variant="tertiary" onClick={() => go(dayjs().startOf('month'))}>
              Aujourd’hui
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Affichage" className="grid grid-cols-2 rounded border border-ink">
            {(
              [
                ['mois', 'Mois'],
                ['liste', 'Liste'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={view === value}
                onClick={() => setView(value)}
                className={cn('h-10 px-4 text-sm', view === value ? 'bg-ink text-paper' : 'text-ink hover:bg-surface-2')}
              >
                {label}
              </button>
            ))}
          </div>
          <Button onClick={() => setEditing({ event: null, day: null })}>
            <Icon name="plus" size={16} /> Nouvel événement
          </Button>
        </div>
      </div>

      {events.isPending ? (
        <div className="mt-8">
          <LoadingBlock label="Chargement de l’agenda…" lines={6} />
        </div>
      ) : events.isError ? (
        <EmptyState icon={isForbidden(events.error) ? 'cadenas' : 'alerte'} tone="err" title={isForbidden(events.error) ? 'Accès refusé' : 'Agenda indisponible'} className="mt-8">
          {apiErrorMessage(events.error)}
        </EmptyState>
      ) : (
        <div className={cn('grid items-start gap-8', selected && 'xl:grid-cols-[minmax(0,1fr)_360px]')}>
          <div className="min-w-0">
            {view === 'mois' && <MonthGrid month={month} events={monthEvents} selectedId={selectedId} onSelect={(e) => setSelectedId(e.id)} />}
            <MonthList events={monthEvents} selectedId={selectedId} onSelect={(e) => setSelectedId(e.id)} />
          </div>
          {selected && (
            <div className="xl:sticky xl:top-6 xl:mt-6">
              <EventDetail event={selected} onClose={() => setSelectedId(null)} onEdit={() => setEditing({ event: selected, day: null })} />
            </div>
          )}
        </div>
      )}

      {editing && (
        <EventForm
          nodeId={nodeId}
          event={editing.event}
          day={editing.day}
          places={places.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            toast.ok(editing.event ? 'Événement modifié.' : 'Événement créé.');
            setEditing(null);
            setMonth(dayjs(saved.start_at).startOf('month'));
            setSelectedId(saved.id);
          }}
        />
      )}
    </div>
  );
};
