import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';

export type SlotOption = { id: number; startsAt: string; priest: string; available: boolean };

/**
 * Grille de créneaux de confession (WEB-FID-Confession-RDV) : 3 colonnes, écart 8, cases 56 px
 * rayon 12. Heure 15/600 « 16:20 », sous-libellé 12/16. Libre : paper + filet line (sous-libellé
 * `slot.priest`, « Libre » par défaut) ; choisi : aplat b600, « Choisi » ; complet : surface, heure barrée.
 * L'heure est lue « 16 h 20 » par le lecteur d'écran.
 */
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
  <div role="group" aria-label={label} className="grid grid-cols-3 gap-2">
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
            'flex h-14 flex-col items-center justify-center rounded-12 border text-center transition-colors',
            !slot.available && 'cursor-not-allowed border-line bg-surface text-ink-3',
            slot.available && selected && 'border-primary-fill bg-primary-fill text-on-primary',
            slot.available && !selected && 'border-line bg-paper text-ink hover:border-line-active hover:bg-surface',
          )}
        >
          <span aria-hidden="true" className={cn('tnum text-15 font-semibold leading-5', !slot.available && 'line-through')}>
            {dayjs(slot.startsAt).format('HH:mm')}
          </span>
          <span className="sr-only">{hour(slot.startsAt)}</span>
          <span className={cn('text-12', selected ? 'text-tint-100' : !slot.available ? 'text-ink-3' : 'text-ink-2')}>
            {!slot.available ? 'Complet' : selected ? 'Choisi' : slot.priest || 'Libre'}
          </span>
        </button>
      );
    })}
  </div>
);
