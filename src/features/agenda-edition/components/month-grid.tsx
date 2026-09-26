'use client';

import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import type { StaffEvent } from '../api/staff-events';
import { monthTitle, monthWeeks, onDay } from '../utils/calendar';

const DAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

/** « 9:30 » (grille du mois, comme la maquette). */
export const clockOf = (iso: string) => dayjs(iso).format('H:mm');

/** Numéro du jour dans la case : « 1er oct. » pour le premier du mois. */
const DayNumber = ({ day }: { day: dayjs.Dayjs }) =>
  day.date() === 1 ? (
    <>
      1<sup className="hidden leading-none sm:inline">er</sup>
      <span className="hidden sm:inline"> {day.format('MMM')}</span>
    </>
  ) : (
    <>{day.date()}</>
  );

type MonthGridProps = {
  month: dayjs.Dayjs;
  events: StaffEvent[];
  selectedDay: string;
  selectedId: number | null;
  onSelectDay: (day: string) => void;
  onSelect: (event: StaffEvent) => void;
};

/**
 * Grille du mois (PAR-Agenda) : carte encadrée, en-tête des jours sur fond surface, cases de 128 px ;
 * jours voisins sur surface, jour choisi sur b50 avec filet b600 de 2 px, aujourd'hui en pastille.
 * Un événement est un bouton (heure 600 puis titre sur deux lignes au plus).
 */
export const MonthGrid = ({ month, events, selectedDay, selectedId, onSelectDay, onSelect }: MonthGridProps) => {
  const today = dayjs().format('YYYY-MM-DD');
  return (
    <section aria-label={`${monthTitle(month)}, vue mois`} className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
      <div className="grid grid-cols-7 bg-surface" aria-hidden="true">
        {DAYS.map((d, i) => (
          <span key={d} className={cn('px-2 py-2.5 text-13 font-medium text-ink-3', i > 0 && 'border-l border-line')}>
            {d}
          </span>
        ))}
      </div>
      {monthWeeks(month).map((week) => (
        <div key={week[0]} className="grid grid-cols-7">
          {week.map((day, i) => {
            const d = dayjs(day);
            const outside = !d.isSame(month, 'month');
            const selected = day === selectedDay;
            const dayEvents = events.filter((e) => onDay(e, day));
            return (
              <div
                key={day}
                role="group"
                aria-label={d.format('dddd D MMMM')}
                className={cn(
                  'flex min-h-16 min-w-0 flex-col gap-1 border-t sm:min-h-32 border-line px-1.5 pb-2 pt-1.5',
                  i > 0 && 'border-l',
                  outside ? 'bg-surface' : 'bg-paper',
                  selected && 'bg-tint-50 shadow-[inset_0_0_0_2px_var(--jb-primary-fill)]',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectDay(day)}
                  aria-pressed={selected}
                  aria-label={`Voir le ${d.format('dddd D MMMM')}`}
                  className={cn(
                    'hit tnum inline-flex h-6 min-w-6 items-center self-start rounded-full text-13 font-semibold',
                    day === today || selected ? 'justify-center bg-primary-fill px-1.5 text-on-primary' : cn('px-0.5', outside ? 'text-ink-4' : 'text-ink'),
                  )}
                >
                  <DayNumber day={d} />
                </button>
                {dayEvents.length > 0 && (
                  // Petite largeur : un point par événement ; le panneau du jour les détaille.
                  <span aria-hidden="true" className="flex flex-wrap gap-1 px-0.5 sm:hidden">
                    {dayEvents.map((event) => (
                      <span key={event.id} className={cn('size-1.5 rounded-full', event.is_cancelled ? 'bg-ink-4' : 'bg-primary-fill')} />
                    ))}
                  </span>
                )}
                {dayEvents.length > 0 && (
                  <ul className="m-0 hidden list-none flex-col gap-1 p-0 sm:flex">
                    {dayEvents.map((event) => (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(event)}
                          aria-pressed={selectedId === event.id}
                          className={cn(
                            'block w-full rounded-6 px-1.5 py-1 text-left text-12 transition-colors [overflow-wrap:anywhere]',
                            selectedId === event.id ? 'bg-primary-fill text-on-primary' : 'bg-tint-50 text-tint-900 hover:bg-tint-100',
                            event.is_cancelled && selectedId !== event.id && 'bg-surface-2 text-ink-3 line-through',
                          )}
                        >
                          <span className="tnum block font-semibold">{clockOf(event.start_at)}</span>
                          <span className="line-clamp-2">{frenchTypo(event.title)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
};
