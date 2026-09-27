'use client';

import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { nextBooking, useMyConfessionBookings } from '../api/get-my-confession-bookings';
import type { ParishWeek } from '../api/get-parish-week';
import { dayLabel } from '../utils/day-label';
import { nextOccurrence, rangeLabel, timeLabel } from '../utils/schedule';

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Carte « Confessions » : prochaine permanence publiée, mon prochain rendez-vous, réserver ou gérer. */
export const ConfessionCard = ({ week }: { week: ParishWeek | undefined }) => {
  const { data: bookings } = useMyConfessionBookings();
  const now = new Date();
  const booking = nextBooking(bookings, now);
  const session = nextOccurrence(week, 'confession', now);

  return (
    <Card as="section" aria-labelledby="mp-confessions">
      <h2 id="mp-confessions" className="m-0 text-18 font-semibold text-ink">
        Confessions
      </h2>
      <p className="m-0 mt-1 text-14 text-ink-2">
        {session
          ? `Prochaine permanence ${lowerFirst(dayLabel(session.date, now))}, ${rangeLabel(session)}, ${session.place_name}. `
          : ''}
        Réservez un créneau pour éviter l’attente.
      </p>
      {booking && (
        <p className="m-0 mt-4 flex items-center gap-3 rounded-12 bg-ok-bg p-3 text-14 text-ok">
          <Icon name="succes" size={20} className="shrink-0" />
          <span>
            <span className="font-semibold">
              {dayjs(booking.slot.starts_at).format('dddd D').replace(/^./, (c) => c.toUpperCase())} à {timeLabel(dayjs(booking.slot.starts_at).format('HH:mm'))}
            </span>
            <br />
            {booking.slot.priest_name} · {dayjs(booking.slot.ends_at).diff(dayjs(booking.slot.starts_at), 'minute')}&nbsp;min
          </span>
        </p>
      )}
      <NextLink href={paths.app.confession.getHref()} className={cn(buttonVariants({ variant: 'outline', block: true }), `${booking ? 'mt-3' : 'mt-4'} h-11 hover:no-underline`)}>
        {booking ? 'Gérer mon rendez-vous' : 'Réserver un créneau'}
      </NextLink>
    </Card>
  );
};
