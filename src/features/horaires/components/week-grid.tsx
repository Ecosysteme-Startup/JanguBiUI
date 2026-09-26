import { Icon } from '@/components/ui/icon';
import type { Place } from '@/hooks/use-backoffice-places';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import type { Schedule } from '../api/get-place-schedule';
import type { ScheduleException } from '../api/place-exceptions';
import { clock, exceptionForSlot, formatTime, KIND_LABELS, type ScheduleKind, WEEKDAYS, WEEKDAYS_SHORT } from '../utils/schedule';

/** Couleur du point par célébration (légende de la semaine type). */
export const KIND_DOT: Record<ScheduleKind, string> = { messe: 'bg-primary-fill', confession: 'bg-lit-violet', adoration: 'bg-lit-gold' };

export const KindLegend = () => (
  <ul aria-label="Légende" className="m-0 flex list-none flex-wrap items-center gap-4 p-0 text-13 text-ink-2">
    {(Object.keys(KIND_LABELS) as ScheduleKind[]).map((k) => (
      <li key={k} className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className={cn('size-2 rounded-full', KIND_DOT[k])} />
        {KIND_LABELS[k]}
      </li>
    ))}
  </ul>
);

/** Nature du lieu en un mot, sous l'horaire (« Église », « Chapelle »). */
const PLACE_SHORT: Record<string, string> = {
  eglise_paroissiale: 'Église',
  succursale: 'Succursale',
  chapelle: 'Chapelle',
  station: 'Station',
  sanctuaire: 'Sanctuaire',
};

export type PlacedSchedule = Schedule & { place: Place };

const SlotCard = ({ slot, exceptions, showPlace, busy, onRemove }: {
  slot: PlacedSchedule;
  exceptions: ScheduleException[];
  showPlace: boolean;
  busy: boolean;
  onRemove: () => void;
}) => {
  const exception = exceptionForSlot(slot, exceptions);
  const where = [showPlace ? (PLACE_SHORT[slot.place.kind] ?? slot.place.name) : null, slot.end_time ? `jusqu’à ${clock(slot.end_time)}` : null]
    .filter(Boolean)
    .join(', ');
  return (
    <li className="relative flex flex-col gap-0.5 rounded-12 border border-line bg-paper py-2.5 pl-3 pr-8">
      <span className="tnum flex items-center gap-1.5 whitespace-nowrap text-15 font-semibold text-ink">
        <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', KIND_DOT[slot.kind])} />
        {clock(slot.start_time)}
      </span>
      <span className="text-13 text-ink">{slot.note || KIND_LABELS[slot.kind]}</span>
      {where && <span className="text-12 text-ink-3">{where.charAt(0).toUpperCase() + where.slice(1)}</span>}
      {exception && (
        <span className="text-12 font-semibold text-warn">
          {exception.cancelled ? 'Annulée' : 'Exception'} le {dayjs(exception.date).format('D MMM')}
        </span>
      )}
      <span className="absolute right-1 top-1">
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          aria-label={`Supprimer : ${KIND_LABELS[slot.kind].toLowerCase()} du ${WEEKDAYS[slot.weekday].toLowerCase()} à ${formatTime(slot.start_time)}`}
          className="hit inline-flex size-7 items-center justify-center rounded-8 text-ink-3 hover:bg-surface-2 hover:text-err disabled:cursor-not-allowed"
        >
          <Icon name="x" size={16} />
        </button>
      </span>
    </li>
  );
};

/**
 * Semaine type (PAR-Horaires) : sept colonnes sur fond surface, une carte par horaire (point de
 * couleur de la célébration, heure, intitulé, lieu), la prochaine exception signalée en warnT.
 */
export const WeekGrid = ({ label, slots, exceptionsByPlace, showPlace, busy, onRemove }: {
  label: string;
  slots: PlacedSchedule[];
  exceptionsByPlace: Record<number, ScheduleException[]>;
  showPlace: boolean;
  busy: boolean;
  onRemove: (slot: PlacedSchedule) => void;
}) => (
  <div role="group" aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
    {WEEKDAYS_SHORT.map((day, weekday) => {
      const items = slots.filter((s) => s.weekday === weekday).sort((a, b) => a.start_time.localeCompare(b.start_time));
      return (
        <section key={day} aria-label={WEEKDAYS[weekday]} className="flex min-h-40 min-w-0 flex-col gap-2 rounded-14 bg-surface px-2 pb-2 pt-3">
          <h3 className="m-0 px-1 text-13 font-semibold text-ink-2">
            <abbr title={WEEKDAYS[weekday]} className="no-underline">
              {day}
            </abbr>
          </h3>
          {items.length === 0 ? (
            <p className="m-0 px-1 text-13 text-ink-3">Aucun horaire</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {items.map((s) => (
                <SlotCard
                  key={`${s.place.id}-${s.id}`}
                  slot={s}
                  exceptions={exceptionsByPlace[s.place.id] ?? []}
                  showPlace={showPlace}
                  busy={busy}
                  onRemove={() => onRemove(s)}
                />
              ))}
            </ul>
          )}
        </section>
      );
    })}
  </div>
);
