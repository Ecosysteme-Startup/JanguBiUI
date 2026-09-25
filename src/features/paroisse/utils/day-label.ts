import { dayjs } from '@/utils/dates';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Aujourd'hui », « Demain », sinon « Samedi 26 septembre ». */
export const dayLabel = (date: string, now: Date = new Date()) => {
  const d = dayjs(date).startOf('day');
  const today = dayjs(now).startOf('day');
  const diff = d.diff(today, 'day');
  if (diff === 0) return 'Aujourd’hui';
  if (diff === 1) return 'Demain';
  return capitalize(d.format('dddd D MMMM'));
};

/** « ce soir, 18 h 30 », « demain, 7 h », « samedi, 16 h » (en-tête de la paroisse). */
export const whenLabel = (date: string, time: string, now: Date = new Date()) => {
  const d = dayjs(date).startOf('day');
  const diff = d.diff(dayjs(now).startOf('day'), 'day');
  const [h = '0', m = '00'] = time.split(':');
  const hour = m === '00' ? `${Number(h)} h` : `${Number(h)} h ${m}`;
  if (diff === 0) return `${Number(h) >= 17 ? 'ce soir' : 'aujourd’hui'}, ${hour}`;
  if (diff === 1) return `demain, ${hour}`;
  return `${d.format('dddd')}, ${hour}`;
};
