'use client';

import NextLink from 'next/link';

import { Button, buttonVariants } from '@/components/ui/button';
import { cardClasses } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { SkeletonLine } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { dayjs, hour } from '@/utils/dates';

import { type HomeBooking, useMyBookings } from '../api/get-my-bookings';
import { bookingIcs, nextBooking } from '../utils/home';

import { HomeSection } from './home-section';

const NO_REASON = 'Aucun motif n’est demandé. Seuls la date et l’heure sont conservées.';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Télécharge le rendez-vous au format iCalendar, sans quitter la page. */
const downloadIcs = (booking: HomeBooking) => {
  const url = URL.createObjectURL(new Blob([bookingIcs(booking)], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `confession-${dayjs(booking.slot.starts_at).format('YYYY-MM-DD')}.ics`;
  link.click();
  URL.revokeObjectURL(url);
};

const BookingCard = ({ booking }: { booking: HomeBooking }) => {
  const start = dayjs(booking.slot.starts_at);
  const minutes = dayjs(booking.slot.ends_at).diff(start, 'minute');
  return (
    <div className={cardClasses()}>
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-12 bg-tint-50 text-tint-800"
        >
          <span className="text-12">{start.format('ddd')}</span>
          <span className="tnum text-22 font-semibold leading-none">{start.format('D')}</span>
          <span className="text-12">{start.format('MMM')}</span>
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-16 font-semibold text-ink">
            {capitalize(start.format('dddd D MMMM'))} à {hour(start)}
          </span>
          <span className="text-14 text-ink-2">
            {booking.slot.priest_name}
            {minutes > 0 && ` · ${minutes} min`}
          </span>
          <span className="text-14 text-ink-2">{booking.slot.place.name}</span>
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => downloadIcs(booking)} className="whitespace-nowrap">
          <Icon name="calendrier" size={18} />
          Ajouter à l’agenda
        </Button>
        <NextLink href={paths.app.confession.getHref()} className={buttonVariants({ variant: 'ghost', className: 'px-3' })}>
          Modifier
        </NextLink>
      </div>
      <p className="m-0 mt-4 text-13 text-ink-3">{NO_REASON}</p>
    </div>
  );
};

/** « Rendez-vous de confession » (FID-Accueil) : la confession se fait en présentiel, jamais par message. */
export const ConfessionCard = ({ className }: { className?: string }) => {
  const { data, isPending, isError } = useMyBookings();
  const booking = data ? nextBooking(data, new Date()) : null;
  return (
    <HomeSection id="acc-confession" title="Rendez-vous de confession" className={className}>
      {isPending ? (
        <div role="status" className={cardClasses()}>
          <span className="sr-only">Chargement de vos rendez-vous…</span>
          <SkeletonLine className="text-16" width="w-2/3" />
          <SkeletonLine className="text-14" width="w-1/2" />
          <SkeletonLine className="text-14" width="w-1/2" />
        </div>
      ) : isError ? (
        <p className="m-0 text-15 text-ink-2">Vos rendez-vous n’ont pas pu être chargés.</p>
      ) : booking ? (
        <BookingCard booking={booking} />
      ) : (
        <div className={cardClasses()}>
          <p className="m-0 text-16 font-semibold text-ink">Aucun rendez-vous prévu.</p>
          <p className="m-0 mt-1 text-14 text-ink-2">
            La confession ne se fait pas par message : réservez un créneau auprès d’un prêtre.
          </p>
          <NextLink href={paths.app.confession.getHref()} className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
            <Icon name="calendrier" size={18} />
            Prendre rendez-vous
          </NextLink>
          <p className="m-0 mt-4 text-13 text-ink-3">{NO_REASON}</p>
        </div>
      )}
    </HomeSection>
  );
};
