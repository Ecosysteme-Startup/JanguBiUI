import { dayjs } from '@/utils/dates';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Date de l'URL (`?date=`) : acceptée seulement au format AAAA-MM-JJ et valide. */
export const parseDateParam = (value: string | string[] | undefined): string | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !ISO.test(raw)) return undefined;
  const d = dayjs(raw);
  return d.isValid() && d.format('YYYY-MM-DD') === raw ? raw : undefined;
};

export const shiftDay = (date: string, days: number) => dayjs(date).add(days, 'day').format('YYYY-MM-DD');

/** Les sept jours de la semaine (lundi → dimanche) qui contient `date`. */
export const weekOf = (date: string): string[] => {
  const d = dayjs(date);
  const monday = d.subtract((d.day() + 6) % 7, 'day');
  return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day').format('YYYY-MM-DD'));
};

/** Dimanche suivant (strictement après `date`). */
export const nextSunday = (date: string) => {
  const d = dayjs(date);
  return d.add(7 - d.day() || 7, 'day').format('YYYY-MM-DD');
};
