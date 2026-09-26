'use client';

import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';

import { useMyBookings } from '../api/get-my-bookings';
import type { Booking } from '../api/schemas';

import { DateTile } from './date-tile';

/** Le prochain rendez-vous réservé, s'il existe. */
export const nextBooking = (bookings: Booking[], now = dayjs()) =>
  bookings
    .filter((b) => b.status === 'reservee' && dayjs(b.slot.starts_at).isAfter(now))
    .sort((a, b) => a.slot.starts_at.localeCompare(b.slot.starts_at))[0] ?? null;

/** « Prochain rendez-vous » (FID-Conversation) : rien s'il n'y en a pas. */
export const NextBookingCard = ({ className }: { className?: string }) => {
  const bookings = useMyBookings();
  const next = bookings.data ? nextBooking(bookings.data) : null;
  if (!next) return null;
  const minutes = dayjs(next.slot.ends_at).diff(dayjs(next.slot.starts_at), 'minute');
  return (
    <NextLink
      href={paths.app.confession.getHref()}
      className={cn(
        'flex items-center gap-3 rounded-12 border border-line bg-surface px-3.5 py-3 text-ink transition-colors hover:border-line-active hover:text-ink',
        className,
      )}
    >
      <DateTile date={next.slot.starts_at} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-13 text-ink-3">Prochain rendez-vous</span>
        <span className="text-15 font-semibold">Confession à {hour(next.slot.starts_at)}</span>
        <span className="truncate text-13 text-ink-2">
          {next.slot.priest_name} · {minutes} min
        </span>
      </span>
      <Icon name="chevron-droite" size={18} className="shrink-0 text-ink-3" />
    </NextLink>
  );
};
