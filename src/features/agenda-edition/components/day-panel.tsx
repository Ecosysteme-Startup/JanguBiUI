'use client';

import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { EVENT_TYPE_LABELS, type StaffEvent } from '../api/staff-events';
import { onDay } from '../utils/calendar';

import { EventDetail } from './event-detail';
import { clockOf } from './month-grid';

type DayPanelProps = {
  nodeId: string;
  day: string;
  events: StaffEvent[];
  selected: StaffEvent | null;
  onSelect: (event: StaffEvent) => void;
  onClose: () => void;
  onCreate: (day: string) => void;
  onEdit: (event: StaffEvent) => void;
  onDuplicate: (event: StaffEvent) => void;
};

/**
 * Panneau du jour (PAR-Agenda, colonne de droite) : les événements du jour choisi, en cartes
 * (heure, filet, titre et lieu) ; l'événement choisi en b50, puis son détail et ses actions.
 */
export const DayPanel = ({ nodeId, day, events, selected, onSelect, onClose, onCreate, onEdit, onDuplicate }: DayPanelProps) => {
  const d = dayjs(day);
  const title = d.format('dddd D MMMM');
  const dayEvents = events.filter((e) => onDay(e, day)).sort((a, b) => a.start_at.localeCompare(b.start_at));
  return (
    <aside aria-labelledby="ag-jour" className="flex flex-col gap-4">
      <div className="rounded-16 border border-line bg-paper p-5 shadow-card">
        <h2 id="ag-jour" className="m-0 text-20 font-semibold text-ink">
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </h2>
        {dayEvents.length === 0 ? (
          <p className="m-0 mt-2 text-14 text-ink-3">Aucun événement ce jour.</p>
        ) : (
          <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
            {dayEvents.map((event) => {
              const active = selected?.id === event.id;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(event)}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full gap-3 rounded-12 border px-3.5 py-3 text-left transition-colors',
                      active ? 'border-line-active bg-tint-50' : 'border-line bg-paper hover:border-line-active',
                    )}
                  >
                    <span className="tnum w-11 shrink-0 text-15 font-semibold text-ink">{dayjs(event.start_at).isSame(d, 'day') ? clockOf(event.start_at) : '—'}</span>
                    <span aria-hidden="true" className="w-px self-stretch bg-line" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn('text-15 font-semibold text-ink', event.is_cancelled && 'text-ink-3 line-through')}>{frenchTypo(event.title)}</span>
                      <span className="text-13 text-ink-3">
                        {[EVENT_TYPE_LABELS[event.event_type], event.location].filter(Boolean).join(' · ')}
                        {event.is_cancelled && ' · annulé'}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {selected ? (
          <EventDetail event={selected} onClose={onClose} onEdit={() => onEdit(selected)} onDuplicate={() => onDuplicate(selected)} />
        ) : (
          <Button variant="outline" className="mt-4 w-full text-14" onClick={() => onCreate(day)}>
            <Icon name="plus" size={18} className="text-ink-2" /> Ajouter un événement ce jour
          </Button>
        )}
      </div>
      <p className="m-0 flex items-start gap-2 px-1 text-13 text-ink-3">
        <Icon name="info" size={16} className="mt-px shrink-0" />
        <span>
          Les messes régulières se gèrent dans{' '}
          <NextLink href={paths.espace.horaires.getHref(nodeId)} className="font-semibold">
            Horaires et lieux
          </NextLink>
          . Les événements apparaissent dans « Ma paroisse » pour les fidèles qui suivent la paroisse.
        </span>
      </p>
    </aside>
  );
};
