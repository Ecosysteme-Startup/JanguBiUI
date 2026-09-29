import { dayjs } from '@/utils/dates';

import { DAY_FORMAT } from './week';

export type CalendarDay = { day: string; inMonth: boolean };

/** Premier jour du mois d'une date. */
export const monthStartOf = (d: dayjs.ConfigType) => dayjs(d).startOf('month').format(DAY_FORMAT);

/** « Septembre 2026 » */
export const monthLabel = (monthStart: string) => {
  const label = dayjs(monthStart).format('MMMM YYYY');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Semaines complètes (lundi → dimanche) qui couvrent le mois. */
export const monthGrid = (monthStart: string): CalendarDay[] => {
  const start = dayjs(monthStart).startOf('month');
  const first = start.startOf('week');
  const last = start.endOf('month').endOf('week');
  const count = last.diff(first, 'day') + 1;
  return Array.from({ length: count }, (_, i) => {
    const d = first.add(i, 'day');
    return { day: d.format(DAY_FORMAT), inMonth: d.month() === start.month() };
  });
};

const TITLES = /^(abbé|père|mgr|frère|don|sœur|soeur)$/i;

/** « Abbé Augustin Ndiaye » → « Abbé Ndiaye » ; sans titre, le nom complet. */
export const pillName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 3 || !TITLES.test(parts[0])) return name.trim();
  return `${parts[0]} ${parts.at(-1)}`;
};
