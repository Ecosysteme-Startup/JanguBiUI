import isoWeek from 'dayjs/plugin/isoWeek';

import { dayjs } from '@/utils/dates';

dayjs.extend(isoWeek);

const numberFormat = new Intl.NumberFormat('fr-FR');
const decimalFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** « 1 480 » (espace fine insécable des milliers). */
export const n = (value: number) => numberFormat.format(value);
/** « 4,2 » */
export const dec = (value: number) => decimalFormat.format(value);
/** « 61 % » */
export const pct = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}\u00a0%` : '—');
/** Pluriel simple : « 2 demandes », « 1 demande ». */
export const plural = (count: number, one: string, many: string) => `${n(count)} ${count > 1 ? many : one}`;

/** « 24.09 à 06 h 00 » */
export const stamp = (iso: string) => {
  const d = dayjs(iso);
  return `${d.format('DD.MM')} à ${d.format('HH')} h ${d.format('mm')}`;
};

/** « Sem. 39 — Du lundi 21 au dimanche 27 septembre » */
export const weekLabel = (now: dayjs.ConfigType = undefined) => {
  const d = dayjs(now);
  const monday = d.isoWeekday(1);
  const sunday = d.isoWeekday(7);
  const end = sunday.format('D MMMM');
  const start = monday.month() === sunday.month() ? monday.format('D') : monday.format('D MMMM');
  return `Sem. ${d.isoWeek()} — Du lundi ${start} au dimanche ${end}`;
};

/** « 5 h », « 1 j 3 h » pour une médiane en heures. */
export const hours = (value: number | null) => {
  if (value === null) return '—';
  if (value < 24) return `${dec(value)}\u00a0h`;
  const days = Math.floor(value / 24);
  const rest = Math.round(value - days * 24);
  return rest ? `${days}\u00a0j ${rest}\u00a0h` : `${days}\u00a0j`;
};

/** « 4,2 jours » */
export const days = (value: number | null) => (value === null ? '—' : `${dec(value)}\u00a0jour${value > 1 ? 's' : ''}`);
