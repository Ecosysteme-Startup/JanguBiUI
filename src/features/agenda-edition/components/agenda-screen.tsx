'use client';

import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterPill } from '@/components/ui/filter-pill';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';
import { pluralWord } from '@/utils/plural';

import { type StaffEvent, useStaffEvents } from '../api/staff-events';
import { type AgendaView, periodBounds, useAgendaPeriod } from '../hooks/use-agenda-period';
import { inMonth, inWeek, monthTitle, weekRange, weekStart, weekTitle } from '../utils/calendar';

import { DayPanel } from './day-panel';
import { EventForm } from './event-form';
import { EventList } from './event-list';
import { MonthGrid } from './month-grid';
import { WeekGrid } from './week-grid';

const VIEWS: readonly (readonly [AgendaView, string])[] = [
  ['mois', 'Mois'],
  ['semaine', 'Semaine'],
  ['liste', 'Liste'],
];

type Editing = { event: StaffEvent | null; template?: StaffEvent; day: string | null } | null;

/** Point d'ancrage d'un mois : aujourd'hui s'il en fait partie, sinon le 1er. */
const monthAnchor = (month: dayjs.Dayjs) => (month.isSame(dayjs(), 'month') ? dayjs() : month.startOf('month')).format('YYYY-MM-DD');

const navButton = 'hit inline-flex size-9 items-center justify-center rounded-10 border border-line bg-paper text-ink hover:bg-surface-2';

/** Filtre « Tous les lieux » en pilule (en attendant une primitive partagée). */
const PlaceFilter = ({ value, onChange, places }: { value: string; onChange: (v: string) => void; places: { id: number; name: string }[] }) => {
  const id = useId();
  return (
    <FilterPill id={id} label="Lieu de culte" allLabel="Tous les lieux" activeTone="filled" value={value} onChange={onChange}>
      {places.map((p) => (
        <option key={p.id} value={String(p.id)}>
          {p.name}
        </option>
      ))}
    </FilterPill>
  );
};

/** PAR-Agenda : calendrier du mois ou de la semaine, liste, panneau du jour, création, modification, duplication. */
export const AgendaScreen = ({ nodeId }: { nodeId: string }) => {
  const { period, update } = useAgendaPeriod(nodeId);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState(period.date);
  const [editing, setEditing] = useState<Editing>(null);
  const [place, setPlace] = useState('');
  const isWeek = period.view === 'semaine';
  const month = dayjs(period.date).startOf('month');
  // Période chargée : la semaine affichée, ou les semaines complètes de la grille du mois.
  const events = useStaffEvents(nodeId, periodBounds(period));
  const places = useBackofficePlaces(nodeId);

  const shownEvents = (events.data?.results ?? [])
    .filter((e) => (isWeek ? inWeek(e, period.date) : inMonth(e, month)))
    .filter((e) => !place || String(e.place_id) === place);
  const selected = shownEvents.find((e) => e.id === selectedId) ?? null;
  const go = (date: string) => {
    update({ date });
    setSelectedDay(date);
    setSelectedId(null);
  };
  const select = (event: StaffEvent) => {
    setSelectedId(event.id);
    setSelectedDay(dayjs(event.start_at).format('YYYY-MM-DD'));
  };
  const week = weekStart(period.date);
  const nav = isWeek
    ? {
        title: weekTitle(period.date),
        prev: { label: `Semaine précédente : ${weekRange(week.subtract(7, 'day'))}`, date: week.subtract(7, 'day').format('YYYY-MM-DD') },
        next: { label: `Semaine suivante : ${weekRange(week.add(7, 'day'))}`, date: week.add(7, 'day').format('YYYY-MM-DD') },
        count: 'cette semaine',
      }
    : {
        title: monthTitle(month),
        prev: { label: `Mois précédent : ${month.subtract(1, 'month').format('MMMM')}`, date: monthAnchor(month.subtract(1, 'month')) },
        next: { label: `Mois suivant : ${month.add(1, 'month').format('MMMM')}`, date: monthAnchor(month.add(1, 'month')) },
        count: `en ${month.format('MMMM')}`,
      };

  return (
    <div>
      <PageHeader
        compact
        title="Agenda"
        description="Les événements de la paroisse, en plus des horaires réguliers des messes."
        actions={
          <>
            {(places.data ?? []).length > 1 && <PlaceFilter value={place} onChange={setPlace} places={places.data ?? []} />}
            <Button className="min-h-11 px-5" onClick={() => setEditing({ event: null, day: null })}>
              <Icon name="plus" size={18} /> Nouvel événement
            </Button>
          </>
        }
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" aria-label={nav.prev.label} onClick={() => go(nav.prev.date)} className={navButton}>
            <Icon name="chevron-gauche" size={18} />
          </button>
          <button type="button" aria-label={nav.next.label} onClick={() => go(nav.next.date)} className={navButton}>
            <Icon name="chevron-droite" size={18} />
          </button>
          <h2 className="m-0 ml-1 text-22 font-semibold text-ink">{nav.title}</h2>
          <Button variant="outline" size="sm" className="ml-1 min-h-9 text-14" onClick={() => go(dayjs().format('YYYY-MM-DD'))}>
            Aujourd’hui
          </Button>
        </div>
        <SegmentedControl
          label="Affichage"
          value={period.view}
          options={VIEWS}
          size="xs"
          onChange={(value) => {
            update({ view: value });
            setSelectedId(null);
          }}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {events.data && `${shownEvents.length} ${pluralWord(shownEvents.length, 'événement', 'événements')} ${nav.count}`}
      </p>

      {events.isPending ? (
        <div className="mt-4">
          <LoadingBlock label="Chargement de l’agenda…" lines={6} />
        </div>
      ) : events.isError ? (
        <EmptyState icon={isForbidden(events.error) ? 'cadenas' : 'alerte'} tone="err" title={isForbidden(events.error) ? 'Accès refusé' : 'Agenda indisponible'} className="mt-4">
          {apiErrorMessage(events.error)}
        </EmptyState>
      ) : (
        <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {period.view === 'mois' && (
              <MonthGrid month={month} events={shownEvents} selectedDay={selectedDay} selectedId={selectedId} onSelectDay={setSelectedDay} onSelect={select} />
            )}
            {isWeek && <WeekGrid date={period.date} events={shownEvents} selectedId={selectedId} onSelect={select} />}
            {period.view === 'liste' && <EventList label={`${nav.title}, vue liste`} events={shownEvents} selectedId={selectedId} onSelect={select} />}
          </div>
          <DayPanel
            nodeId={nodeId}
            day={selectedDay}
            events={shownEvents}
            selected={selected}
            onSelect={select}
            onClose={() => setSelectedId(null)}
            onCreate={(day) => setEditing({ event: null, day })}
            onEdit={(event) => setEditing({ event, day: null })}
            onDuplicate={(event) => setEditing({ event: null, template: event, day: null })}
          />
        </div>
      )}

      {editing && (
        <EventForm
          nodeId={nodeId}
          event={editing.event}
          template={editing.template}
          day={editing.day}
          places={places.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            toast.ok(editing.event ? 'Événement modifié.' : 'Événement créé.');
            setEditing(null);
            update({ date: dayjs(saved.start_at).format('YYYY-MM-DD') });
            select(saved);
          }}
        />
      )}
    </div>
  );
};
