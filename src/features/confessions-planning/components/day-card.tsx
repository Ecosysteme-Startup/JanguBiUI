'use client';

import { Icon } from '@/components/ui/icon';

import type { PlanningSlot } from '../api/schemas';
import { dayRange, isBooked, slotMinutes } from '../utils/planning';

import { DayGrid } from './day-grid';
import { SlotDetail } from './slot-detail';

type DayCardProps = {
  title: string;
  slots: PlanningSlot[];
  current: PlanningSlot | null;
  canManage: boolean;
  onSelect: (slot: PlanningSlot) => void;
  onDone: () => void;
  emptyHint?: string;
};

/** Carte du jour (maquette PAR-Confessions) : plage, taux de réservation, grille par confesseur. */
export const DayCard = ({ title, slots, current, canManage, onSelect, onDone, emptyHint }: DayCardProps) => {
  const open = slots.filter((s) => s.status !== 'bloque').length;
  const taken = slots.filter(isBooked).length;
  const minutes = slotMinutes(slots);
  const places = [...new Set(slots.map((s) => s.place.name))];

  return (
    <section aria-labelledby="planning-jour" className="mt-4 rounded-16 border border-line bg-paper px-6 pb-4 pt-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 id="planning-jour" className="m-0 text-20 font-semibold text-ink">
            {title}
          </h2>
          {slots.length > 0 && (
            <p className="m-0 mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-14 text-ink-2">
              <span className="tnum inline-flex items-center gap-1.5">
                <Icon name="horloge" size={16} />
                {dayRange(slots)}
                {minutes ? ` · créneaux de ${minutes}\u00a0min` : ''}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="pin" size={16} />
                {places.join(', ')}
              </span>
            </p>
          )}
        </div>
        {open > 0 && (
          <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
            <span className="tnum text-14 text-ink-2">
              <strong className="font-semibold text-ink">
                {taken} réservé{taken > 1 ? 's' : ''}
              </strong>{' '}
              sur {open} place{open > 1 ? 's' : ''} ouverte{open > 1 ? 's' : ''}
            </span>
            <span aria-hidden="true" className="flex h-1.5 w-[200px] overflow-hidden rounded-full bg-surface-2">
              <span className="origin-left animate-jb-grow bg-primary-fill" style={{ width: `${Math.round((taken / open) * 100)}%` }} />
            </span>
          </div>
        )}
      </div>

      {slots.length === 0 ? (
        <p className="m-0 mt-4 border-t border-line pt-4 text-15 text-ink-2">
          Aucun créneau ce jour.{emptyHint ? ` ${emptyHint}` : ''}
        </p>
      ) : (
        <>
          <div className="mt-5">
            <DayGrid label={`Créneaux du ${title.toLowerCase()} par confesseur`} slots={slots} selectedId={current?.id ?? null} onSelect={onSelect} />
          </div>
          {current && <SlotDetail key={current.id} slot={current} canManage={canManage} onDone={onDone} />}
        </>
      )}

      <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="m-0 flex items-start gap-2 text-13 text-ink-3">
          <Icon name="cadenas" size={16} className="mt-px shrink-0" />
          <span>
            Le secrétariat ne voit que des initiales, le prêtre le nom de la personne qu’il reçoit. Aucun motif n’est demandé ni enregistré.
          </span>
        </p>
        {taken > 0 && (
          <button type="button" onClick={() => window.print()} className="hit inline-flex shrink-0 items-center gap-1.5 text-14 font-semibold text-primary hover:underline">
            <Icon name="imprimer" size={16} />
            Imprimer la liste du jour
          </button>
        )}
      </div>
    </section>
  );
};
