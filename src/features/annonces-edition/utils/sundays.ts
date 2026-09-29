import { dayjs } from '@/utils/dates';

/** Les `count` prochains dimanches à partir de `from` (inclus s'il est un dimanche), au format ISO. */
export const nextSundays = (from: dayjs.ConfigType, count = 6): string[] => {
  const start = dayjs(from).startOf('day');
  const first = start.day() === 0 ? start : start.add(7 - start.day(), 'day');
  return Array.from({ length: count }, (_, i) => first.add(i * 7, 'day').format('YYYY-MM-DD'));
};

/** « Dimanche 27 septembre 2026 » */
export const sundayLabel = (iso: string) => {
  const label = dayjs(iso).format('dddd D MMMM YYYY');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const isSunday = (iso: string) => dayjs(iso).day() === 0;
