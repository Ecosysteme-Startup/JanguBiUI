import { dayjs } from '@/utils/dates';

import type { Slot } from '../api/schemas';

export const DAY_FORMAT = 'YYYY-MM-DD';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Lundi de la semaine d'une date (locale fr : la semaine commence le lundi). */
export const weekStartOf = (d: dayjs.ConfigType) =>
  dayjs(d).startOf('week').format(DAY_FORMAT);

export const weekDays = (weekStart: string) =>
  Array.from({ length: 7 }, (_, i) =>
    dayjs(weekStart).add(i, 'day').format(DAY_FORMAT),
  );

/** « semaine du 21 au 27 septembre » */
export const weekLabel = (weekStart: string) => {
  const start = dayjs(weekStart);
  const end = start.add(6, 'day');
  return start.month() === end.month()
    ? `semaine du ${start.format('D')} au ${end.format('D MMMM')}`
    : `semaine du ${start.format('D MMMM')} au ${end.format('D MMMM')}`;
};

/** « Samedi 26 septembre » */
export const dayTitle = (d: dayjs.ConfigType) =>
  capitalize(dayjs(d).format('dddd D MMMM'));

export const slotsOfDay = (slots: Slot[], day: string) =>
  slots.filter((s) => dayjs(s.starts_at).format(DAY_FORMAT) === day);

/** Nom court du prêtre pour la grille : « Abbé Augustin Ndiaye » → « A. Ndiaye ». */
export const shortName = (name: string) => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => !/^(abbé|père|mgr|frère|don)$/i.test(p));
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
};
