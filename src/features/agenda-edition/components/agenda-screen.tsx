'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type StaffEvent, useStaffEvents } from '../api/staff-events';
import { type AgendaView, periodBounds, useAgendaPeriod } from '../hooks/use-agenda-period';
import { inMonth, inWeek, monthTitle, monthWeeks, onDay, weekRange, weekStart, weekTitle } from '../utils/calendar';

import { EventDetail } from './event-detail';
import { EventForm } from './event-form';
import { WeekGrid } from './week-grid';

const DAYS = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

const VIEWS: readonly (readonly [AgendaView, string])[] = [
  ['mois', 'Mois'],
  ['semaine', 'Semaine'],
  ['liste', 'Liste'],
];

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

const MonthList = ({
  events,
  selectedId,
  onSelect,
  week = false,
}: {
  events: StaffEvent[];
  selectedId: number | null;
  onSelect: (event: StaffEvent) => void;
  week?: boolean;
}) => (
  <section aria-labelledby="ag-liste" className="mt-10">
    <h2 id="ag-liste" className="tnum m-0 border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
      <span className="text-primary">04</span> — {week ? 'Cette semaine' : 'Ce mois-ci'}
    </h2>
    {events.length === 0 ? (
      <p className="m-0 mt-3 text-sm text-ink-3">Aucun événement {week ? 'cette semaine' : 'ce mois-ci'}.</p>
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
                    {event.max_participants ? <> · {event.seats_taken} / {event.max_participants} places</> : null}
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

/** Point d'ancrage d'un mois : aujourd'hui s'il en fait partie, sinon le 1er. */
const monthAnchor = (month: dayjs.Dayjs) => (month.isSame(dayjs(), 'month') ? dayjs() : month.startOf('month')).format('YYYY-MM-DD');

/** PAR-Agenda : calendrier du mois ou de la semaine, liste, détail d'un événement, création et modification. */
export const AgendaScreen = ({ nodeId }: { nodeId: string }) => {
  const { period, update } = useAgendaPeriod(nodeId);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const isWeek = period.view === 'semaine';
  const month = dayjs(period.date).startOf('month');
  // Période chargée : la semaine affichée, ou les semaines complètes de la grille du mois.
  const events = useStaffEvents(nodeId, periodBounds(period));
  const places = useBackofficePlaces(nodeId);

  const shownEvents = (events.data?.results ?? []).filter((e) => (isWeek ? inWeek(e, period.date) : inMonth(e, month)));
  const selected = shownEvents.find((e) => e.id === selectedId) ?? null;
  const go = (date: string) => {
    update({ date });
    setSelectedId(null);
  };
  const week = weekStart(period.date);
  const nav = isWeek
    ? {
        title: weekTitle(period.date),
        prev: { label: `Semaine précédente : ${weekRange(week.subtract(7, 'day'))}`, date: week.subtract(7, 'day').format('YYYY-MM-DD') },
        next: { label: `Semaine suivante : ${weekRange(week.add(7, 'day'))}`, date: week.add(7, 'day').format('YYYY-MM-DD') },
        count: `cette semaine`,
      }
    : {
        title: monthTitle(month),
        prev: { label: `Mois précédent : ${month.subtract(1, 'month').format('MMMM')}`, date: monthAnchor(month.subtract(1, 'month')) },
        next: { label: `Mois suivant : ${month.add(1, 'month').format('MMMM')}`, date: monthAnchor(month.add(1, 'month')) },
        count: `en ${month.format('MMMM')}`,
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
                · {shownEvents.length} événement{shownEvents.length > 1 ? 's' : ''} {nav.count}
              </>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="m-0 font-serif text-title font-normal text-ink">{nav.title}</h1>
            <button type="button" aria-label={nav.prev.label} onClick={() => go(nav.prev.date)} className="inline-flex size-11 items-center justify-center rounded border border-line hover:bg-surface-2">
              <Icon name="chevron-gauche" size={18} />
            </button>
            <button type="button" aria-label={nav.next.label} onClick={() => go(nav.next.date)} className="inline-flex size-11 items-center justify-center rounded border border-line hover:bg-surface-2">
              <Icon name="chevron-droite" size={18} />
            </button>
            <Button variant="tertiary" onClick={() => go(dayjs().format('YYYY-MM-DD'))}>
              Aujourd’hui
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            label="Affichage"
            value={period.view}
            options={VIEWS}
            onChange={(value) => {
              update({ view: value });
              setSelectedId(null);
            }}
          />
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
            {period.view === 'mois' && <MonthGrid month={month} events={shownEvents} selectedId={selectedId} onSelect={(e) => setSelectedId(e.id)} />}
            {isWeek && <WeekGrid date={period.date} events={shownEvents} selectedId={selectedId} onSelect={(e) => setSelectedId(e.id)} />}
            <MonthList events={shownEvents} selectedId={selectedId} onSelect={(e) => setSelectedId(e.id)} week={isWeek} />
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
            update({ date: dayjs(saved.start_at).format('YYYY-MM-DD') });
            setSelectedId(saved.id);
          }}
        />
      )}
    </div>
  );
};
