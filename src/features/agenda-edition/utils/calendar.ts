import { dayjs } from '@/utils/dates';

/**
 * Semaines (lundi → dimanche) couvrant le mois de `month`, jours ISO. Les jours des mois
 * voisins complètent la première et la dernière semaine.
 */
export const monthWeeks = (month: dayjs.ConfigType): string[][] => {
  const first = dayjs(month).startOf('month');
  const start = first.subtract((first.day() + 6) % 7, 'day');
  const last = first.endOf('month');
  const weeks: string[][] = [];
  for (let cursor = start; cursor.isBefore(last) || cursor.isSame(last, 'day'); cursor = cursor.add(7, 'day')) {
    weeks.push(Array.from({ length: 7 }, (_, i) => cursor.add(i, 'day').format('YYYY-MM-DD')));
  }
  return weeks;
};

/** « Octobre 2026 » */
export const monthTitle = (month: dayjs.ConfigType) => {
  const label = dayjs(month).format('MMMM YYYY');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Un événement touche-t-il ce jour ? (les événements sur plusieurs jours apparaissent chaque jour). */
export const onDay = (event: { start_at: string; end_at: string }, day: string) => {
  const d = dayjs(day);
  return !d.isBefore(dayjs(event.start_at), 'day') && !d.isAfter(dayjs(event.end_at), 'day');
};

export const inMonth = (event: { start_at: string; end_at: string }, month: dayjs.ConfigType) => {
  const m = dayjs(month);
  return !dayjs(event.end_at).isBefore(m.startOf('month')) && !dayjs(event.start_at).isAfter(m.endOf('month'));
};
