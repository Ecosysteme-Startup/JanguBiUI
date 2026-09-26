import { dayjs } from '@/utils/dates';

import type { Slot } from '../api/schemas';

export const DAY_FORMAT = 'YYYY-MM-DD';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
