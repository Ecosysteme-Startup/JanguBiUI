import { Button } from '@/components/ui/button';

import type { PlanningSlot } from '../api/schemas';
import { slotMinutes, usualSchedule } from '../utils/planning';

/** « Paramètres » : ce que le planning montre des réglages (durée, plage habituelle, lieux). */
export const PlanningSettings = ({
  slots,
  canManage,
  onEdit,
}: {
  slots: PlanningSlot[];
  canManage: boolean;
  onEdit: () => void;
}) => {
  const minutes = slotMinutes(slots);
  const usual = usualSchedule(slots);
  const placeNames = [...new Set(slots.map((s) => s.place.name))];
  const rows: [string, string][] = [
    ['Durée d’un créneau', minutes ? `${minutes} min` : '—'],
    ['Plage habituelle', usual ? `${usual.weekday.charAt(0).toUpperCase()}${usual.weekday.slice(1)}, ${usual.range}` : '—'],
    [placeNames.length > 1 ? 'Lieux' : 'Lieu', placeNames.join(', ') || '—'],
  ];
  return (
    <section aria-labelledby="parametres-confessions" className="rounded-16 border border-line bg-paper p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <h2 id="parametres-confessions" className="m-0 text-20 font-semibold text-ink">
          Paramètres
        </h2>
        {canManage && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="-mr-2 -mt-1">
            Modifier
          </Button>
        )}
      </div>
      <dl className="m-0 mt-2">
        {rows.map(([term, value], index) => (
          <div key={term} className={`flex justify-between gap-3 py-3 text-14 ${index < rows.length - 1 ? 'border-b border-line' : ''}`}>
            <dt className="text-ink-2">{term}</dt>
            <dd className="tnum m-0 text-right font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
