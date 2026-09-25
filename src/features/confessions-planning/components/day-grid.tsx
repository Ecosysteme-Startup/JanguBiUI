import { cn } from '@/utils/cn';
import { hour } from '@/utils/dates';

import type { PlanningSlot } from '../api/schemas';
import { badgeOf, byPriest, isBooked } from '../utils/planning';

const slotLabel = (slot: PlanningSlot) => {
  const time = hour(slot.starts_at);
  if (slot.status === 'bloque') return `${time}, retiré`;
  if (isBooked(slot)) return `${time}, pris par ${slot.booking!.person}`;
  return `${time}, libre`;
};

/** Planning d'un jour, une ligne par prêtre (PAR-Confessions, section 02). */
export const DayGrid = ({
  slots,
  selectedId,
  onSelect,
}: {
  slots: PlanningSlot[];
  selectedId: number | null;
  onSelect: (slot: PlanningSlot) => void;
}) => (
  <div className="flex flex-col gap-4">
    {byPriest(slots).map((group) => {
      const taken = group.slots.filter(isBooked).length;
      const open = group.slots.filter((s) => s.status !== 'bloque').length;
      return (
        <div
          key={group.priestId}
          role="group"
          aria-label={`${group.name}${group.mine ? ', vous' : ''}, ${taken} créneau${taken > 1 ? 'x' : ''} pris sur ${open}`}
          className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center"
        >
          <p className="m-0 text-sm text-ink">
            <span className={cn(group.mine && 'font-semibold')}>
              {group.name}
              {group.mine ? ' · vous' : ''}
            </span>
            <span className="tnum ml-2 text-meta text-ink-3">
              {taken} / {open}
            </span>
          </p>
          <div className="flex flex-wrap gap-1">
            {group.slots.map((slot) => {
              const booked = isBooked(slot);
              const selected = slot.id === selectedId;
              return (
                <button
                  key={slot.id}
                  type="button"
                  aria-label={`${slotLabel(slot)}${selected ? ', sélectionné' : ''}`}
                  aria-pressed={selected}
                  onClick={() => onSelect(slot)}
                  className={cn(
                    'tnum inline-flex size-11 items-center justify-center rounded border text-meta',
                    slot.status === 'bloque' &&
                      'border-dashed border-line text-ink-3',
                    slot.status !== 'bloque' &&
                      !booked &&
                      'border-line bg-surface text-ink-3 hover:border-primary',
                    booked && 'border-night-2 bg-tint-100 text-night-2',
                    selected &&
                      'border-primary-fill bg-primary-fill text-on-primary',
                  )}
                >
                  {booked ? badgeOf(slot.booking!.person) : ''}
                </button>
              );
            })}
          </div>
        </div>
      );
    })}
    <p className="tnum m-0 flex flex-wrap items-center gap-4 text-meta text-ink-3">
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block size-3 rounded border border-line bg-surface"
        />
        Libre
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block size-3 rounded border border-night-2 bg-tint-100"
        />
        Pris
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block size-3 rounded bg-primary-fill"
        />
        Sélectionné
      </span>
      {slots[0] && <span>{slots[0].place.name}</span>}
    </p>
  </div>
);
