import { Avatar } from '@/components/ui/avatar';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';

import type { PlanningSlot } from '../api/schemas';
import { byPriest, isBooked, timeColumns, withoutTitle } from '../utils/planning';

const slotLabel = (slot: PlanningSlot) => {
  const time = hour(slot.starts_at);
  if (slot.status === 'bloque') return `${time}, fermé`;
  if (isBooked(slot)) return `${time}, pris par ${slot.booking!.person}`;
  return `${time}, libre`;
};

type DayGridProps = {
  label: string;
  slots: PlanningSlot[];
  selectedId: number | null;
  onSelect: (slot: PlanningSlot) => void;
};

/**
 * Planning d'un jour (maquette PAR-Confessions) : une ligne par prêtre, une colonne par heure
 * de début. Cellule 52 px, rayon 10 : réservée (b100, prénom), libre (tirets), fermée (surface2).
 */
export const DayGrid = ({ label, slots, selectedId, onSelect }: DayGridProps) => {
  const columns = timeColumns(slots);
  const template = { gridTemplateColumns: `176px repeat(${columns.length}, minmax(44px, 1fr))` };
  return (
    <ScrollRegion label={`${label}, défilement horizontal`}>
      <div role="grid" aria-label={label} className="min-w-fit">
        <div role="row" className="grid items-end gap-1 pb-2" style={template}>
          <span role="columnheader">
            <span className="sr-only">Confesseur</span>
          </span>
          {columns.map((time) => (
            <span key={time} role="columnheader" className="tnum text-center text-12 text-ink-3">
              {time}
            </span>
          ))}
        </div>
        {byPriest(slots).map((group) => {
          const taken = group.slots.filter(isBooked).length;
          const open = group.slots.filter((s) => s.status !== 'bloque').length;
          return (
            <div key={group.priestId} role="row" className="grid items-center gap-1 border-t border-line py-1.5" style={template}>
              <span role="rowheader" className="flex min-w-0 items-center gap-2.5 pr-2">
                <Avatar name={withoutTitle(group.name)} size={32} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-14 font-semibold text-ink">
                    {group.name}
                    {group.mine ? ' · vous' : ''}
                  </span>
                  <span className="tnum truncate text-12 text-ink-3">
                    {taken} réservé{taken > 1 ? 's' : ''} sur {open}
                  </span>
                </span>
              </span>
              {columns.map((time) => {
                const slot = group.slots.find((s) => dayjs(s.starts_at).format('HH:mm') === time);
                if (!slot) {
                  return (
                    <span key={time} role="gridcell" aria-label={`${time}, fermé`} className="flex h-13 items-center justify-center rounded-10 bg-surface-2 text-12 text-ink-3">
                      Fermé
                    </span>
                  );
                }
                const booked = isBooked(slot);
                const selected = slot.id === selectedId;
                return (
                  <span key={time} role="gridcell" aria-selected={selected}>
                    <button
                      type="button"
                      aria-label={`${group.name}, ${slotLabel(slot)}`}
                      aria-pressed={selected}
                      onClick={() => onSelect(slot)}
                      className={cn(
                        'flex h-13 w-full items-center justify-center overflow-hidden rounded-10 px-[3px] text-center text-12 transition-colors',
                        slot.status === 'bloque' && 'bg-surface-2 text-ink-3',
                        slot.status !== 'bloque' && !booked && 'border border-dashed border-line-field bg-paper text-ink-3 hover:border-line-active',
                        booked && 'border border-tint-200 bg-tint-100 font-semibold text-tint-800',
                        selected && 'border-2 border-primary-fill',
                      )}
                    >
                      <span className="line-clamp-2">{booked ? slot.booking!.person : slot.status === 'bloque' ? 'Fermé' : 'Libre'}</span>
                    </button>
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </ScrollRegion>
  );
};
