import { cn } from '@/utils/cn';

export type ScheduleEntry = { weekday: number; time: string; label: string; place?: string };

const DAYS = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

/** Semaine des horaires par lieu de culte (FID-Ma-Paroisse, PAR-Horaires). 0 = lundi. */
export const ScheduleWeek = ({ entries, today, className }: { entries: ScheduleEntry[]; today?: number; className?: string }) => (
  <div className={cn('grid grid-cols-7 border-t border-line-strong', className)}>
    {DAYS.map((day, weekday) => {
      const items = entries.filter((e) => e.weekday === weekday).sort((a, b) => a.time.localeCompare(b.time));
      const isToday = weekday === today;
      return (
        <div key={day} className={cn('min-h-24 border-r border-line px-2 py-2 last:border-r-0', isToday && 'bg-tint-50')}>
          <p className={cn('tnum m-0 text-meta', isToday ? 'font-semibold text-primary' : 'text-ink-3')}>{day}</p>
          <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
            {items.map((item, i) => (
              <li key={i} className="flex flex-col">
                <span className="tnum font-serif text-lead leading-none text-ink">{item.time}</span>
                <span className="text-xs text-ink-2">{item.label}</span>
                {item.place && <span className="text-xs text-ink-3">{item.place}</span>}
              </li>
            ))}
          </ul>
        </div>
      );
    })}
  </div>
);
