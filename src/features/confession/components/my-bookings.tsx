'use client';

import { useState } from 'react';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/utils/api-errors';
import { dayjs, hour } from '@/utils/dates';

import { useCancelBooking } from '../api/cancel-booking';
import { useMyBookings } from '../api/get-my-bookings';
import type { Booking } from '../api/schemas';
import { dayTitle } from '../utils/week';

import { DateTile } from './date-tile';

const STATUS: Record<Booking['status'], { label: string; tone: BadgeTone }> = {
  reservee: { label: 'Réservé', tone: 'info' },
  annulee_fidele: { label: 'Annulé par vous', tone: 'muted' },
  annulee_pretre: { label: 'Annulé par le prêtre', tone: 'warn' },
  honoree: { label: 'Honoré', tone: 'ok' },
  absent: { label: 'Absent', tone: 'muted' },
};

/** À venir, ou annulés par le prêtre depuis peu (le fidèle doit voir le message). */
const isRelevant = (b: Booking) =>
  dayjs(b.slot.starts_at).isAfter(dayjs()) &&
  (b.status === 'reservee' || b.status === 'annulee_pretre');

const BookingRow = ({
  booking,
  onCancel,
}: {
  booking: Booking;
  onCancel: (b: Booking) => void;
}) => (
  <li className="flex flex-col gap-2 border-t border-line py-3">
    <div className="flex items-start gap-3">
      <DateTile date={booking.slot.starts_at} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-15 font-semibold text-ink">
          {hour(booking.slot.starts_at)} · {booking.slot.priest_name}
        </p>
        <p className="m-0 text-13 text-ink-2">{booking.slot.place.name}</p>
        <Badge tone={STATUS[booking.status].tone} dot className="mt-1.5">
          {STATUS[booking.status].label}
        </Badge>
      </div>
      {booking.can_cancel && (
        <Button
          variant="ghost"
          size="sm"
          className="text-err hover:bg-err-bg hover:text-err"
          onClick={() => onCancel(booking)}
          aria-label={`Annuler le rendez-vous du ${dayTitle(booking.slot.starts_at)} à ${hour(booking.slot.starts_at)}`}
        >
          Annuler
        </Button>
      )}
    </div>
    {booking.status === 'annulee_pretre' && booking.cancel_message && (
      <p className="m-0 rounded-10 bg-surface px-3 py-2 text-14 text-ink">« {booking.cancel_message} »</p>
    )}
  </li>
);

/** « Mes rendez-vous à venir » (FID-Confession-RDV). */
export const MyBookings = () => {
  const bookings = useMyBookings();
  const cancel = useCancelBooking();
  const [target, setTarget] = useState<Booking | null>(null);
  const list = (bookings.data ?? []).filter(isRelevant);

  const confirm = () => {
    if (!target) return;
    cancel.mutate(target.id, {
      onSuccess: () => {
        toast.ok(
          'Votre rendez-vous est annulé. Le créneau est de nouveau libre.',
        );
        setTarget(null);
      },
      onError: (error) => toast.err(apiErrorMessage(error)),
    });
  };

  return (
    <section id="mes-rendez-vous" aria-labelledby="mes-rendez-vous-titre" className="scroll-mt-6 rounded-16 border border-line bg-paper p-6 shadow-card">
      <h2 id="mes-rendez-vous-titre" className="m-0 mb-3 flex items-baseline justify-between text-18 font-semibold text-ink">
        Mes rendez-vous à venir
        {bookings.data && <span className="tnum text-13 font-normal text-ink-3">{list.length}</span>}
      </h2>
      {bookings.isPending ? (
        <LoadingBlock label="Chargement de vos rendez-vous…" lines={2} />
      ) : bookings.isError ? (
        <p role="alert" className="m-0 text-14 text-err">
          Vos rendez-vous n’ont pas pu être chargés.
        </p>
      ) : list.length === 0 ? (
        <p className="m-0 border-t border-line pt-3 text-15 text-ink-2">
          Aucun rendez-vous à venir.
        </p>
      ) : (
        <ul aria-label="Mes rendez-vous à venir" className="m-0 list-none p-0">
          {list.map((b) => (
            <BookingRow key={b.id} booking={b} onCancel={setTarget} />
          ))}
        </ul>
      )}
      <p className="m-0 mt-3 text-13 text-ink-3">
        Un rappel vous est envoyé la veille et deux heures avant.
      </p>
      {target && (
        <Modal
          open
          onOpenChange={(open) => !open && setTarget(null)}
          title="Annuler ce rendez-vous ?"
          description={`${dayTitle(target.slot.starts_at)}, ${hour(target.slot.starts_at)} · ${target.slot.priest_name}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setTarget(null)}>
                Garder
              </Button>
              <Button
                variant="danger"
                onClick={confirm}
                disabled={cancel.isPending}
              >
                Annuler le rendez-vous
              </Button>
            </>
          }
        >
          <p className="m-0 text-15 text-ink-2">
            Le créneau redevient libre pour une autre personne.
          </p>
        </Modal>
      )}
    </section>
  );
};
