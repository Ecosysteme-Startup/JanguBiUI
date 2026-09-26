import { dayjs } from '@/utils/dates';

type MassOccurrence = { date: string; kind: string; start_time: string };

const at = (date: string, time: string) => dayjs(`${date}T${time}`);

/** Les `count` prochaines messes à partir de `now` (les confessions et adorations sont écartées). */
export const upcomingMasses = <T extends MassOccurrence>(week: { occurrences: T[] } | undefined, now: Date, count: number): T[] =>
  (week?.occurrences ?? [])
    .filter((o) => o.kind === 'messe' && !at(o.date, o.start_time).isBefore(now))
    .sort((a, b) => at(a.date, a.start_time).valueOf() - at(b.date, b.start_time).valueOf())
    .slice(0, count);

/** « 18:30:00 » → « 18:30 » */
export const timeHHMM = (time: string) => time.slice(0, 5);

/** « ce soir », « ce matin », « aujourd'hui », « demain », sinon « sam. 26 ». */
export const massDayLabel = (date: string, time: string, now: Date) => {
  const diff = dayjs(date).startOf('day').diff(dayjs(now).startOf('day'), 'day');
  const hourOfDay = Number(time.slice(0, 2));
  if (diff === 0) return hourOfDay >= 17 ? 'ce soir' : hourOfDay < 12 ? 'ce matin' : 'aujourd’hui';
  if (diff === 1) return 'demain';
  return dayjs(date).format('ddd D');
};

/** « Dans 8 h 49 » pour une messe du jour encore à venir, sinon null. */
export const countdownLabel = (date: string, time: string, now: Date): string | null => {
  const start = at(date, time);
  if (!start.isSame(now, 'day') || start.isBefore(now)) return null;
  const minutes = start.diff(dayjs(now), 'minute');
  if (minutes < 60) return `Dans ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `Dans ${h} h` : `Dans ${h} h ${String(m).padStart(2, '0')}`;
};

type BookingLike = {
  id: number;
  status: string;
  slot: { starts_at: string; ends_at: string; priest_name: string; place: { name: string; address: string } };
};

/** Prochain rendez-vous de confession encore réservé. */
export const nextBooking = <T extends BookingLike>(bookings: T[], now: Date): T | null =>
  bookings
    .filter((b) => b.status === 'reservee' && !dayjs(b.slot.starts_at).isBefore(now))
    .sort((a, b) => dayjs(a.slot.starts_at).valueOf() - dayjs(b.slot.starts_at).valueOf())[0] ?? null;

const icsDate = (iso: string) => dayjs(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');

/**
 * Fichier iCalendar du rendez-vous (« Ajouter à l'agenda »). Date, heure, prêtre et lieu
 * seulement : aucun motif, comme la réservation elle-même (RG-08).
 */
export const bookingIcs = (booking: BookingLike): string => {
  const { slot } = booking;
  const location = [slot.place.name, slot.place.address].filter(Boolean).join(', ');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jangu Bi//Confession//FR',
    'BEGIN:VEVENT',
    `UID:confession-${booking.id}@jangubi`,
    `DTSTAMP:${icsDate(slot.starts_at)}`,
    `DTSTART:${icsDate(slot.starts_at)}`,
    `DTEND:${icsDate(slot.ends_at)}`,
    `SUMMARY:${icsText(`Confession avec ${slot.priest_name}`)}`,
    `LOCATION:${icsText(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
};
