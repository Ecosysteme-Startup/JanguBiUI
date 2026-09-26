'use client';

import { useQueries } from '@tanstack/react-query';
import NextLink from 'next/link';

import { LiturgicalDot } from '@/components/ui/badge';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { liturgyDayQueryOptions } from '../api/get-liturgy-day';
import { shortCelebration } from '../utils/calendar';
import { weekOf } from '../utils/days';

/** Nom court d'un jour de la bande : « Férie », « S. Matthieu », « Dimanche ». */
const stripLabel = (celebration: string, rank?: string) => {
  if (rank === 'dimanche' || /dimanche/i.test(celebration)) return 'Dimanche';
  if (rank === 'ferie') return 'Férie';
  return celebration.replace(/^(Saint|Sainte)\s+/, (m) => (m.startsWith('Sainte') ? 'Ste ' : 'S. ')).replace(/,.*$/, '');
};

/**
 * Bande des sept jours de la semaine (WEB-Parole-du-jour) : jour, date, couleur et fête ;
 * le jour affiché est mis en avant, aujourd'hui est signalé.
 */
export const WeekStrip = ({ current, today }: { current: string; today: string | null }) => {
  const dates = weekOf(current);
  const days = useQueries({ queries: dates.map((date) => liturgyDayQueryOptions(date)) });

  return (
    <nav aria-label="Jours de la semaine" className="mt-6">
      <ol className="tnum m-0 grid list-none grid-cols-7 gap-1 p-0 sm:gap-2">
        {dates.map((date, index) => {
          const day = days[index]?.data;
          const selected = date === current;
          const isToday = date === today;
          const weekday = dayjs(date).format('ddd');
          return (
            <li key={date} className="min-w-0">
              <NextLink
                href={paths.parole.getHref(date)}
                aria-current={selected ? 'date' : undefined}
                aria-label={`${dayjs(date).format('dddd D MMMM')}${isToday ? ', aujourd’hui' : ''}${day ? `, ${day.calendar.celebration}` : ''}`}
                className={cn(
                  'flex min-h-11 flex-col items-center gap-0.5 rounded-14 border px-1 py-3 hover:border-line-active hover:text-ink',
                  selected ? 'border-primary bg-tint-50 text-tint-800 ring-1 ring-inset ring-primary hover:border-primary hover:text-tint-800' : 'border-line text-ink',
                )}
              >
                <span className={cn('max-w-full truncate text-13', selected ? 'font-medium' : 'text-ink-3')}>
                  {weekday}
                  {isToday && <span className="hidden md:inline"> · aujourd&apos;hui</span>}
                </span>
                <span className={cn('text-20', selected ? 'font-bold' : 'font-semibold')}>{dayjs(date).format('D')}</span>
                <span className={cn('flex max-w-full items-center gap-1.5 text-12', selected ? 'text-tint-800' : 'text-ink-2')}>
                  {day ? <LiturgicalDot color={day.calendar.color} size={6} className="size-[7px]" /> : <span className="size-[7px]" />}
                  <span className="hidden truncate lg:inline">{day ? stripLabel(shortCelebration(day.calendar), day.calendar.rank) : '…'}</span>
                </span>
              </NextLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
