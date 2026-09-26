'use client';

import { useQueries } from '@tanstack/react-query';
import NextLink from 'next/link';

import { LiturgicalDot } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { iconButtonClasses } from '@/components/ui/icon-button';
import { paths } from '@/config/paths';
import { type LiturgyDay, liturgyDayQueryOptions } from '@/features/parole/api/get-liturgy-day';
import { dayTileLabel, ISO, shiftDay, weekOf } from '@/features/parole/utils/liturgy';
import { cn } from '@/utils/cn';
import { dayjs, longDate } from '@/utils/dates';

/**
 * Bande de dates (FID-Parole) : la semaine du lundi au dimanche, couleur et libellé de chaque jour.
 * La date est dans l'URL (`?date=AAAA-MM-JJ`), donc partageable.
 */
export const DayNav = ({ date, current }: { date: string; current?: LiturgyDay }) => {
  const week = weekOf(date);
  const today = dayjs().format(ISO);
  const days = useQueries({
    queries: week.map((iso) => ({
      ...liturgyDayQueryOptions(iso),
      placeholderData: undefined,
      enabled: iso !== current?.date,
    })),
  });

  return (
    <nav aria-label="Changer de jour" className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2">
      <NextLink href={paths.app.parole.getHref(shiftDay(date, -7))} aria-label="Semaine précédente" className={iconButtonClasses({ bordered: true })}>
        <Icon name="chevron-gauche" size={18} />
      </NextLink>
      <ul className="m-0 grid list-none auto-cols-[minmax(64px,1fr)] grid-flow-col gap-2 overflow-x-auto p-0 text-center">
        {week.map((iso, i) => {
          const day = iso === current?.date ? current : days[i].data;
          const selected = iso === date;
          const label = day ? dayTileLabel(day.calendar) : null;
          return (
            <li key={iso} className="min-w-0">
              <NextLink
                href={paths.app.parole.getHref(iso)}
                aria-current={selected ? 'date' : undefined}
                aria-label={[longDate(iso), label].filter(Boolean).join(', ')}
                className={cn(
                  'flex flex-col items-center rounded-14 border px-1 pb-2.5 pt-2 transition-colors hover:text-ink',
                  selected ? 'border-primary bg-tint-50 text-tint-800 ring-1 ring-inset ring-primary hover:text-tint-800' : 'border-line text-ink hover:border-line-active',
                )}
              >
                <span className={cn('text-12', selected ? 'font-medium' : 'text-ink-3')}>{iso === today ? 'aujourd’hui' : dayjs(iso).format('ddd')}</span>
                <span className={cn('tnum text-18', selected ? 'font-bold' : 'font-semibold')}>{dayjs(iso).format('D')}</span>
                <span className={cn('inline-flex min-h-4 max-w-full items-center gap-1 text-12', !selected && 'text-ink-2')}>
                  {day && <LiturgicalDot color={day.calendar.color} />}
                  <span className="truncate">{label}</span>
                </span>
              </NextLink>
            </li>
          );
        })}
      </ul>
      <NextLink href={paths.app.parole.getHref(shiftDay(date, 7))} aria-label="Semaine suivante" className={iconButtonClasses({ bordered: true })}>
        <Icon name="chevron-droite" size={18} />
      </NextLink>
    </nav>
  );
};
