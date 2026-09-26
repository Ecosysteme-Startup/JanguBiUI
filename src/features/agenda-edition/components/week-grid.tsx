'use client';

import type { CSSProperties } from 'react';

import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import type { StaffEvent } from '../api/staff-events';
import { hourRange, onDay, placeDayEvents, spansDays, weekDays, weekTitle } from '../utils/calendar';

/** Hauteur d'une heure sur la grille (px) : une demi-heure reste une cible de 24 px. */
const HOUR_PX = 48;
/** Hauteur d'une ligne du bandeau « journée » (événements sur plusieurs jours). */
const ALL_DAY_ROW_PX = 32;

interface WeekGridProps {
  date: string;
  events: StaffEvent[];
  selectedId: number | null;
  onSelect: (event: StaffEvent) => void;
}

const eventClass = (selected: boolean, cancelled: boolean) =>
  cn(
    'w-full overflow-hidden rounded border px-1.5 text-left text-xs transition-colors',
    selected ? 'border-ink bg-ink text-paper' : 'border-line bg-tint-50 text-ink hover:bg-surface-2',
    cancelled && !selected && 'text-ink-3 line-through',
  );

/**
 * PAR-Agenda, vue Semaine : sept colonnes (lundi → dimanche) sur une grille horaire. Chaque
 * jour est un groupe nommé ; ses événements sont des boutons dans l'ordre chronologique, donc
 * atteints au clavier dans l'ordre de lecture. Les événements sur plusieurs jours occupent
 * le bandeau « journée » en tête de colonne.
 */
export const WeekGrid = ({ date, events, selectedId, onSelect }: WeekGridProps) => {
  const today = dayjs().format('YYYY-MM-DD');
  const days = weekDays(date);
  const placedByDay = days.map((day) => placeDayEvents(events, day));
  const longByDay = days.map((day) => events.filter((e) => spansDays(e) && onDay(e, day)));
  const { from, to } = hourRange(placedByDay.flat());
  const hours = Array.from({ length: to - from }, (_, i) => from + i);
  const allDayHeight = Math.max(1, ...longByDay.map((l) => l.length)) * ALL_DAY_ROW_PX;
  const timelineHeight = (to - from) * HOUR_PX;

  return (
    <section aria-label={`${weekTitle(date)}, vue semaine`} className="mt-6 overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-[48px_repeat(7,minmax(0,1fr))]">
        <div aria-hidden="true">
          <div className="h-12 border-b border-line-strong" />
          <div className="tnum flex items-center border-b border-line pr-1 text-meta text-ink-3" style={{ height: allDayHeight }}>
            Journée
          </div>
          <div className="relative" style={{ height: timelineHeight }}>
            {hours.map((h) => (
              <span key={h} className="tnum absolute right-2 -translate-y-1/2 text-meta text-ink-3" style={{ top: (h - from) * HOUR_PX }}>
                {h} h
              </span>
            ))}
          </div>
        </div>

        {days.map((day, index) => {
          const d = dayjs(day);
          const isToday = day === today;
          return (
            <div key={day} role="group" aria-label={d.format('dddd D MMMM')} className={cn('min-w-0 border-r border-line', index === 0 && 'border-l')}>
              <div aria-hidden="true" className={cn('flex h-12 items-baseline gap-1.5 border-b border-line-strong px-2 pt-3', isToday && 'bg-tint-50')}>
                <span className="tnum text-meta text-ink-3">{d.format('ddd')}</span>
                <span className={cn('tnum font-serif text-h4', isToday ? 'font-semibold text-primary' : 'text-ink')}>{d.date() === 1 ? '1er' : d.date()}</span>
              </div>
              <ul className="m-0 flex list-none flex-col gap-1 border-b border-line p-1" style={{ height: allDayHeight }}>
                {longByDay[index].map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(event)}
                      aria-pressed={selectedId === event.id}
                      className={cn(eventClass(selectedId === event.id, event.is_cancelled), 'h-6 truncate')}
                    >
                      {frenchTypo(event.title)}
                      <span className="sr-only">
                        , du {dayjs(event.start_at).format('D MMMM')} {hour(event.start_at)} au {dayjs(event.end_at).format('D MMMM')} {hour(event.end_at)}
                        {event.is_cancelled && ', annulé'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <ul
                className="relative m-0 list-none p-0"
                style={{
                  height: timelineHeight,
                  backgroundImage: `repeating-linear-gradient(to bottom, var(--jb-line) 0, var(--jb-line) 1px, transparent 1px, transparent ${HOUR_PX}px)`,
                }}
              >
                {placedByDay[index].map(({ event, startMin, endMin, lane, lanes }) => {
                  const style: CSSProperties = {
                    top: ((startMin - from * 60) / 60) * HOUR_PX,
                    height: ((endMin - startMin) / 60) * HOUR_PX - 2,
                    left: `calc(${(lane / lanes) * 100}% + 2px)`,
                    width: `calc(${100 / lanes}% - 4px)`,
                  };
                  return (
                    <li key={event.id} className="absolute" style={style}>
                      <button
                        type="button"
                        onClick={() => onSelect(event)}
                        aria-pressed={selectedId === event.id}
                        className={cn(eventClass(selectedId === event.id, event.is_cancelled), 'flex h-full flex-col py-0.5')}
                      >
                        <span className="tnum">
                          {hour(event.start_at)}
                          <span className="sr-only"> à {hour(event.end_at)}</span>
                        </span>
                        <span className="truncate font-medium">{frenchTypo(event.title)}</span>
                        {event.is_cancelled && <span className="sr-only">, annulé</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};
