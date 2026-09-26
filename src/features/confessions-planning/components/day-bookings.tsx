'use client';

import { useState } from 'react';

import { IconButton } from '@/components/ui/icon-button';
import { SectionHeading } from '@/components/ui/section-heading';
import { dayjs, hour } from '@/utils/dates';
import { plural } from '@/utils/plural';

import type { PlanningSlot } from '../api/schemas';
import { isBooked } from '../utils/planning';

import { CancelSlotForm } from './cancel-slot-form';

/** Rendez-vous du jour (PAR-Confessions, section 03) : initiales pour l'équipe, aucun motif. */
export const DayBookings = ({
  slots,
  dayLabel,
  canManage,
}: {
  slots: PlanningSlot[];
  dayLabel: string;
  canManage: boolean;
}) => {
  const [cancelling, setCancelling] = useState<number | null>(null);
  const booked = slots.filter(isBooked);
  const free = slots.filter((s) => s.status === 'libre').length;

  return (
    <section aria-labelledby="rdv-jour">
      <SectionHeading
        id="rdv-jour"
        number="03"
        title={`Rendez-vous du ${dayLabel}`}
        aside={`${booked.length} pris · ${plural(free, 'libre', 'libres')}`}
      />
      <p className="m-0 mb-2 text-sm text-ink-2">
        Par discrétion : initiales seulement pour l’équipe, aucun motif demandé.
      </p>
      {booked.length === 0 ? (
        <p className="m-0 py-3 text-base text-ink-2">
          Aucun rendez-vous ce jour.
        </p>
      ) : (
        <ul
          aria-label={`Rendez-vous du ${dayLabel}`}
          className="m-0 list-none p-0"
        >
          {booked.map((slot) => {
            const future = dayjs(slot.starts_at).isAfter(dayjs());
            const canCancel = canManage && slot.is_mine && future;
            return (
              <li
                key={slot.id}
                className="flex flex-col gap-2 border-b border-line py-2.5"
              >
                <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 text-base">
                  <span className="tnum text-ink">{hour(slot.starts_at)}</span>
                  <span className="min-w-0">
                    <span className="font-semibold text-ink">
                      {slot.booking!.person}
                    </span>
                    <span className="block truncate text-sm text-ink-2">
                      {slot.is_mine ? 'Vous' : slot.priest_name}
                    </span>
                  </span>
                  {canCancel ? (
                    <IconButton
                      icon="x"
                      size="sm"
                      label={`Annuler le rendez-vous de ${hour(slot.starts_at)} (${slot.booking!.person})`}
                      onClick={() => setCancelling(slot.id)}
                    />
                  ) : (
                    <span />
                  )}
                </div>
                {cancelling === slot.id && (
                  <CancelSlotForm
                    slot={slot}
                    onDone={() => setCancelling(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
