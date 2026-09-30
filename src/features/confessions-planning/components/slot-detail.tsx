'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/utils/api-errors';
import { dayjs, hour } from '@/utils/dates';

import { useMarkAttendance } from '../api/mark-attendance';
import type { PlanningSlot } from '../api/schemas';
import { isBooked } from '../utils/planning';

import { CancelSlotForm } from './cancel-slot-form';

/** Présence enregistrée sur le rendez-vous (`honoree` / `absent`), sinon rien. */
const ATTENDANCE: Record<string, { label: string; tone: 'ok' | 'muted' }> = {
  honoree: { label: 'Venu', tone: 'ok' },
  absent: { label: 'Absent', tone: 'muted' },
};

/**
 * Détail d'un créneau choisi : le prêtre peut annuler SON rendez-vous ou retirer SON créneau libre,
 * et, une fois l'heure passée, noter si la personne est venue. Aucun contenu n'est jamais demandé.
 */
export const SlotDetail = ({ slot, canManage, onDone }: { slot: PlanningSlot; canManage: boolean; onDone: () => void }) => {
  const [cancelling, setCancelling] = useState(false);
  const attendance = useMarkAttendance();
  const booked = isBooked(slot);
  const past = !dayjs(slot.starts_at).isAfter(dayjs());
  const editable = canManage && slot.is_mine && slot.status !== 'bloque' && !past;
  const recorded = booked ? ATTENDANCE[slot.booking!.status] : undefined;
  const canMark = canManage && slot.is_mine && booked && past && slot.booking!.status === 'reservee';
  const summary = `${hour(slot.starts_at)} · ${slot.priest_name} · ${slot.status === 'bloque' ? 'fermé' : booked ? `pris par ${slot.booking!.person}` : 'libre'}`;

  const mark = (attended: boolean) =>
    attendance.mutate(
      { bookingId: slot.booking!.id, attended },
      {
        onSuccess: () => toast.ok(attended ? 'Présence notée.' : 'Absence notée.'),
        onError: (error) => toast.err(apiErrorMessage(error)),
      },
    );

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-12 bg-surface px-4 py-3" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="tnum m-0 flex flex-wrap items-center gap-2 text-14 text-ink">
          <span>{summary}</span>
          {recorded && (
            <Badge tone={recorded.tone} dot>
              {recorded.label}
            </Badge>
          )}
        </p>
        {canMark && (
          <div className="flex flex-wrap gap-2" role="group" aria-label={`Présence au rendez-vous de ${hour(slot.starts_at)}`}>
            <Button
              variant="outline"
              size="sm"
              disabled={attendance.isPending}
              onClick={() => mark(true)}
              aria-label={`Venu au rendez-vous de ${hour(slot.starts_at)} (${slot.booking!.person})`}
            >
              Venu
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={attendance.isPending}
              onClick={() => mark(false)}
              aria-label={`Absent au rendez-vous de ${hour(slot.starts_at)} (${slot.booking!.person})`}
            >
              Absent
            </Button>
          </div>
        )}
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
