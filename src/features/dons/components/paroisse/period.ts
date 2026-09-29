import { dayjs } from '@/utils/dates';

import type { Period } from '../../api/export-and-reconciliation';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Mois courant « AAAA-MM ». */
export const currentMonth = (): string => dayjs().format('YYYY-MM');

/** Mois de `?mois=` s'il est valide, sinon le mois courant. */
export const monthOrCurrent = (value: string | null | undefined): string =>
  value && MONTH_RE.test(value) ? value : currentMonth();

/** Du premier au dernier jour du mois. */
export const monthPeriod = (month: string): Period => {
  const start = dayjs(`${month}-01`);
  return {
    date_from: start.format('YYYY-MM-DD'),
    date_to: start.endOf('month').format('YYYY-MM-DD'),
  };
};

/** « Septembre 2026 » */
export const monthLabel = (month: string): string =>
  capitalize(dayjs(`${month}-01`).format('MMMM YYYY'));

/** « septembre » */
export const monthName = (month: string): string =>
  dayjs(`${month}-01`).format('MMMM');

/** Les `count` derniers mois, le plus récent en tête (sélecteur de mois). */
export const recentMonths = (count = 12, from = currentMonth()): string[] =>
  Array.from({ length: count }, (_, i) =>
    dayjs(`${from}-01`).subtract(i, 'month').format('YYYY-MM'),
  );

/** « 1er juin » / « 26 sept. » (jour et mois courts). */
export const dayMonth = (date: string): string => {
  const d = dayjs(date);
  return `${d.date() === 1 ? '1er' : d.date()} ${d.format('MMM')}`;
};

/** « 26 sept. au 4 oct. » ; `null` si une borne manque. */
export const dateRange = (
  start: string | null | undefined,
  end: string | null | undefined,
): string | null =>
  start && end ? `${dayMonth(start)} au ${dayMonth(end)}` : null;

/** « 28 sept. 9:12 » (table des opérations). */
export const dayMonthTime = (iso: string): string =>
  `${dayjs(iso).format('D MMM')} ${dayjs(iso).format('H:mm')}`;

/** « 20 sept. à 20:14 » */
export const dayMonthAtTime = (iso: string): string =>
  `${dayjs(iso).format('D MMM')} à ${dayjs(iso).format('H:mm')}`;

/** Dimanche qui termine la semaine de `date` (le jour même si c'est un dimanche). */
export const weekSunday = (date: string): string => {
  const d = dayjs(date);
  return d.add((7 - d.day()) % 7, 'day').format('YYYY-MM-DD');
};
