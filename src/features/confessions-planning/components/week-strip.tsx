import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import type { PlanningSlot } from '../api/schemas';
import { DAY_FORMAT, dayOf, dayTitle, isBooked } from '../utils/planning';

type WeekStripProps = {
  days: string[];
  slots: PlanningSlot[];
  active: string;
  onSelect: (day: string) => void;
  onMove: (delta: number) => void;
};

/** Bande des sept jours (maquette PAR-Confessions) : tuile 56 px, point sous les jours ouverts. */
export const WeekStrip = ({ days, slots, active, onSelect, onMove }: WeekStripProps) => {
  const today = dayjs().format(DAY_FORMAT);
  return (
    <div className="flex w-full items-center gap-1 sm:w-auto">
      <IconButton icon="chevron-gauche" label="Semaine précédente" size="sm" onClick={() => onMove(-1)} />
      <ol aria-label="Jours de la semaine" className="m-0 flex min-w-0 flex-1 list-none gap-0.5 p-0 sm:flex-none sm:gap-1">
        {days.map((day) => {
          const ofDay = slots.filter((s) => dayOf(s) === day && s.status !== 'bloque');
          const taken = ofDay.filter(isBooked).length;
          const selected = day === active;
          return (
            <li key={day} className="min-w-0 flex-1 sm:flex-none">
              <button
                type="button"
                aria-current={selected ? 'date' : undefined}
                aria-label={`${dayTitle(day)}${day === today ? ' (aujourd’hui)' : ''} : ${ofDay.length ? `${taken} pris sur ${ofDay.length}` : 'aucun créneau'}`}
                onClick={() => onSelect(day)}
                className={cn(
                  'flex w-full flex-col items-center gap-0.5 rounded-14 py-2 transition-colors sm:w-14',
                  selected ? 'bg-primary-fill text-on-primary' : 'text-ink hover:bg-surface-2',
                )}
              >
                <span className={cn('text-12', selected ? 'text-on-primary' : 'text-ink-3')}>{dayjs(day).format('ddd')}</span>
                <span className="tnum text-17 font-semibold">{dayjs(day).format('D')}</span>
                <span
                  aria-hidden="true"
                  className={cn('size-[5px] rounded-full', ofDay.length > 0 && (selected ? 'bg-on-primary' : 'bg-primary'))}
                />
              </button>
            </li>
          );
        })}
      </ol>
      <IconButton icon="chevron-droite" label="Semaine suivante" size="sm" onClick={() => onMove(1)} />
    </div>
  );
};
