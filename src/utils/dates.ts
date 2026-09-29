import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(dayOfYear);
dayjs.extend(relativeTime);
dayjs.locale('fr');

export { dayjs };

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Jeudi 24 septembre 2026 » */
export const longDate = (d: dayjs.ConfigType) => capitalize(dayjs(d).format('dddd D MMMM YYYY'));
/** « jeu. 24 sept. » */
export const shortDate = (d: dayjs.ConfigType) => dayjs(d).format('ddd D MMM');
/** « 21.09 » */
export const dotDate = (d: dayjs.ConfigType) => dayjs(d).format('DD.MM');
/** « 18 h 30 » */
export const hour = (d: dayjs.ConfigType) => {
  const m = dayjs(d);
  return m.minute() ? `${m.hour()} h ${m.format('mm')}` : `${m.hour()} h`;
};
/** Jour de l'année (bandeau liturgique). */
export const dayNumber = (d: dayjs.ConfigType) => dayjs(d).dayOfYear();
export const fromNow = (d: dayjs.ConfigType) => dayjs(d).fromNow();
