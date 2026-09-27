'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { dayjs, hour } from '@/utils/dates';

import type { PlanningSlot } from '../api/schemas';
import { isBooked } from '../utils/planning';

import { CancelSlotForm } from './cancel-slot-form';

/** Détail d'un créneau choisi : le prêtre peut annuler SON rendez-vous ou retirer SON créneau libre. */
export const SlotDetail = ({ slot, canManage, onDone }: { slot: PlanningSlot; canManage: boolean; onDone: () => void }) => {
  const [cancelling, setCancelling] = useState(false);
  const booked = isBooked(slot);
  const editable = canManage && slot.is_mine && slot.status !== 'bloque' && dayjs(slot.starts_at).isAfter(dayjs());
  const summary = `${hour(slot.starts_at)} · ${slot.priest_name} · ${slot.status === 'bloque' ? 'fermé' : booked ? `pris par ${slot.booking!.person}` : 'libre'}`;
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-12 bg-surface px-4 py-3" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="tnum m-0 text-14 text-ink">{summary}</p>
        {editable && !cancelling && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setCancelling(true)}
            aria-label={booked ? `Annuler le rendez-vous de ${hour(slot.starts_at)} (${slot.booking!.person})` : `Retirer le créneau de ${hour(slot.starts_at)}`}
          >
            {booked ? 'Annuler le rendez-vous' : 'Retirer le créneau'}
          </Button>
        )}
      </div>
      {cancelling && <CancelSlotForm key={slot.id} slot={slot} onDone={onDone} />}
    </div>
  );
};
