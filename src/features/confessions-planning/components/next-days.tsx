import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { plural } from '@/utils/plural';

import { dayTitle, type UpcomingDay } from '../utils/planning';

/** « Jours suivants » : jours ouverts des semaines à venir, pour y aller directement. */
export const NextDays = ({ days, onOpen }: { days: UpcomingDay[]; onOpen: (day: string) => void }) => (
  <section aria-labelledby="jours-suivants" className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
    <h2 id="jours-suivants" className="m-0 px-5 pb-3.5 pt-5 text-20 font-semibold text-ink">
      Jours suivants
    </h2>
    {days.length === 0 ? (
      <p className="m-0 border-t border-line px-5 py-3.5 text-14 text-ink-3">Aucun créneau ouvert dans les semaines suivantes.</p>
    ) : (
      <ul className="m-0 list-none p-0">
        {days.map((d) => (
          <li key={d.day} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-5 py-3.5">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-15 font-semibold text-ink">{dayTitle(d.day)}</span>
              <span className="tnum text-13 text-ink-3">
                {d.range} · {plural(d.open, 'place', 'places')} · {plural(d.booked, 'réservée', 'réservées')}
              </span>
            </span>
            {d.open > 0 ? (
              <Badge tone="ok" dot>
                Ouverts
              </Badge>
            ) : (
              <Badge tone="neutral" dot>
                Fermés
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => onOpen(d.day)} aria-label={`Voir ${dayTitle(d.day).toLowerCase()}`}>
              Voir
            </Button>
          </li>
        ))}
      </ul>
    )}
  </section>
);
