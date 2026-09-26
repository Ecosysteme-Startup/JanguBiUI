import { cn } from '@/utils/cn';
import { hour } from '@/utils/dates';

export type SlotOption = { id: number; startsAt: string; priest: string; available: boolean };

/** Grille de créneaux de confession (DS-Composants §09) : libre, choisi, complet. */
export const SlotPicker = ({
  slots,
  selectedId,
  onSelect,
  label,
}: {
  slots: SlotOption[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  label: string;
}) => (
  <div role="group" aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {slots.map((slot) => {
      const selected = slot.id === selectedId;
      return (
        <button
          key={slot.id}
          type="button"
          disabled={!slot.available}
          aria-pressed={slot.available ? selected : undefined}
          onClick={() => onSelect(slot.id)}
          className={cn(
            'flex flex-col items-start gap-1 rounded border px-3 py-2.5 text-left transition-colors',
            !slot.available && 'cursor-not-allowed border-dashed border-line bg-transparent text-ink-3',
            slot.available && selected && 'border-primary-fill bg-primary-fill text-on-primary',
            slot.available && !selected && 'border-line bg-surface text-ink hover:border-primary hover:text-primary',
          )}
        >
          <span className={cn('font-serif text-h3 leading-none', !slot.available && 'line-through')}>{hour(slot.startsAt)}</span>
          <span className={cn('text-xs', selected ? 'text-on-primary' : !slot.available ? '' : 'text-ink-2')}>
            {!slot.available ? 'Complet' : selected ? 'Choisi' : slot.priest}
          </span>
        </button>
      );
    })}
  </div>
);
