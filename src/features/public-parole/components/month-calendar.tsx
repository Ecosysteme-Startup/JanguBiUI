'use client';

import { useQueries } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

import { LITURGICAL_DOT, LiturgicalDot, type LiturgicalDotColor } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { liturgyDayQueryOptions } from '../api/get-liturgy-day';

const WEEKDAYS = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];

/** Jours du mois (AAAA-MM-JJ) précédés de cases vides pour caler le 1er sur son jour (lundi d'abord). */
const monthGrid = (month: string): (string | null)[] => {
  const first = dayjs(`${month}-01`);
  const blanks = (first.day() + 6) % 7;
  return [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: first.daysInMonth() }, (_, i) => first.add(i, 'day').format('YYYY-MM-DD')),
  ];
};

/**
 * Calendrier du mois (WEB-Parole-du-jour) : chaque jour mène à ses lectures. La couleur
 * liturgique n'est montrée que pour les jours déjà chargés (aucune requête par jour du mois :
 * l'API n'expose pas encore le calendrier d'un mois).
 */
export const MonthCalendar = ({ current }: { current: string }) => {
  const [month, setMonth] = useState(current.slice(0, 7));
  useEffect(() => setMonth(current.slice(0, 7)), [current]);
  const cells = monthGrid(month);
  const dates = cells.filter((d): d is string => d !== null);
  // Lecture du cache seulement (`enabled: false`) : les jours de la semaine affichée y sont.
  const days = useQueries({ queries: dates.map((date) => ({ ...liturgyDayQueryOptions(date), enabled: false })) });
  const colorOf = new Map(dates.map((date, i) => [date, days[i]?.data?.calendar.color]));
  const shown = [...new Set([...colorOf.values()].filter((c): c is string => Boolean(c)))];
  const label = dayjs(`${month}-01`).format('MMMM YYYY');

  return (
    <section aria-labelledby="mois-titre" className="rounded-16 border border-line bg-paper p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 id="mois-titre" className="m-0 text-17 font-semibold text-ink" aria-live="polite">
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Mois précédent"
            onClick={() => setMonth(dayjs(`${month}-01`).subtract(1, 'month').format('YYYY-MM'))}
            className="hit inline-flex size-8 items-center justify-center rounded-8 text-ink-2 hover:bg-surface hover:text-ink"
          >
            <Icon name="chevron-gauche" size={18} />
          </button>
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={() => setMonth(dayjs(`${month}-01`).add(1, 'month').format('YYYY-MM'))}
            className="hit inline-flex size-8 items-center justify-center rounded-8 text-ink-2 hover:bg-surface hover:text-ink"
          >
            <Icon name="chevron-droite" size={18} />
          </button>
        </div>
      </div>
      <div className="tnum mt-4 grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} aria-hidden="true" className="text-12 leading-6 text-ink-3">
            {d}
          </span>
        ))}
        {cells.map((date, i) =>
          date ? (
            <NextLink
              key={date}
              href={paths.parole.getHref(date)}
              aria-current={date === current ? 'date' : undefined}
              aria-label={dayjs(date).format('dddd D MMMM YYYY')}
              className={cn(
                'flex h-11 flex-col items-center justify-center gap-[3px] rounded-10 text-ink hover:bg-surface hover:text-ink',
                date === current && 'bg-tint-100 font-semibold text-tint-800 hover:bg-tint-100 hover:text-tint-800',
              )}
            >
              <span className="text-14 leading-[18px]">{dayjs(date).format('D')}</span>
              {colorOf.get(date) ? <LiturgicalDot color={colorOf.get(date) ?? 'vert'} className="size-[5px]" /> : <span className="size-[5px]" />}
            </NextLink>
          ) : (
            <span key={`vide-${i}`} />
          ),
        )}
      </div>
      {shown.length > 0 && (
        <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-5 gap-y-2 border-t border-line p-0 pt-4 text-13 text-ink-2">
          {shown.map((color) => (
            <li key={color} className="inline-flex items-center gap-1.5">
              <LiturgicalDot color={color} size={6} />
              {(LITURGICAL_DOT[color as LiturgicalDotColor] ?? LITURGICAL_DOT.vert).label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
