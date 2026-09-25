'use client';

import { useQueries } from '@tanstack/react-query';

import { LITURGICAL_COLORS, type LiturgicalColor, Ordinals } from '@/components/signature/liturgical-banner';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { liturgyDayQueryOptions, useLiturgyDay } from '../api/get-liturgy-day';
import { shortCelebration } from '../utils/calendar';
import { weekOf } from '../utils/days';

const ColorDot = ({ color }: { color: string }) => {
  const c = LITURGICAL_COLORS[color as LiturgicalColor];
  if (!c) return null;
  return (
    <span className={cn('tnum mt-2 inline-flex items-center gap-1.5 text-meta', c.cls.split(' ').find((cls) => cls.startsWith('text-')))}>
      <span className={cn('inline-block size-2 rounded-full', c.dot)} />
      {c.label}
    </span>
  );
};

/** Calendrier liturgique de la semaine en cours (accueil public, Main). */
export const LiturgyWeek = () => {
  const today = useLiturgyDay();
  const dates = today.data ? weekOf(today.data.date) : [];
  const days = useQueries({ queries: dates.map((date) => liturgyDayQueryOptions(date)) });

  if (!today.data) return null;
  const { calendar } = today.data;
  const week = calendar.week ? `${calendar.week}e semaine · ${calendar.season_label.toLowerCase()}` : calendar.season_label;

  return (
    <div className="mt-14 border-t border-ink pt-3">
      <p className="tnum m-0 flex flex-wrap justify-between gap-2 text-meta text-ink-2">
        <span>
          Calendrier liturgique · <Ordinals text={week} />
        </span>
        {calendar.weekday_cycle && calendar.sunday_cycle && (
          <span className="text-ink-3">
            Semaine : année {calendar.weekday_cycle === 'II' ? 'paire' : 'impaire'} · Dimanche : année {calendar.sunday_cycle}
          </span>
        )}
      </p>
      <ol aria-label="Jours de la semaine liturgique" className="m-0 mt-4 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4 lg:grid-cols-7">
        {dates.map((date, index) => {
          const day = days[index]?.data;
          const isToday = date === today.data.date;
          const label = dayjs(date).format('ddd D').replace(/^./, (c) => c.toUpperCase());
          return (
            <li
              key={date}
              aria-current={isToday ? 'date' : undefined}
              className={cn('pt-2.5', isToday ? 'border-t-2 border-ink' : 'border-t border-line')}
            >
              <span className={cn('tnum block text-meta', isToday ? 'text-primary' : 'text-ink-3')}>
                {label}
                {isToday && ' · auj.'}
              </span>
              <span className={cn('mt-1.5 block text-sm leading-snug', isToday ? 'font-semibold' : 'font-medium')}>
                {day ? <Ordinals text={shortCelebration(day.calendar)} /> : '…'}
              </span>
              {day && <ColorDot color={day.calendar.color} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
