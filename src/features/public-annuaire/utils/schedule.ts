import { dayjs } from '@/utils/dates';

import type { Occurrence, Place } from '../api/get-node-week';

const KIND_LABELS: Record<string, string> = { messe: 'messe', confession: 'confessions', adoration: 'adoration' };

/** « 7 h 30 », « 18 h » depuis « HH:MM[:SS] ». */
export const formatTime = (time: string) => {
  const [h, m] = time.split(':');
  const hours = Number(h);
  return m && m !== '00' ? `${hours} h ${m}` : `${hours} h`;
};

/** « 7 h 30 · 9 h 30 · 18 h 30 » : messes du dimanche de l'annuaire ; chaîne vide si aucune. */
export const sundayMassesLabel = (times: string[]) => times.map(formatTime).join(' · ');

/** Libellé d'une occurrence : « 16 h-18 h confessions », « 9 h 30 messe des étudiants ». */
export const occurrenceLabel = (o: Occurrence) => {
  const time = o.end_time && o.kind !== 'messe' ? `${formatTime(o.start_time)}-${formatTime(o.end_time)}` : formatTime(o.start_time);
  const kind = o.kind === 'messe' ? '' : KIND_LABELS[o.kind] ?? o.kind;
  return [time, kind, o.note].filter(Boolean).join(' ');
};

export type PlaceSchedule = { place: Place; days: { date: string; items: Occurrence[] }[] };

/** Horaires de la semaine regroupés par lieu (lieu principal d'abord), puis par jour. */
export const scheduleByPlace = (places: Place[], occurrences: Occurrence[]): PlaceSchedule[] =>
  [...places]
    .sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.name.localeCompare(b.name, 'fr'))
    .map((place) => {
      const own = occurrences.filter((o) => o.place_id === place.id);
      const dates = [...new Set(own.map((o) => o.date))].sort();
      return {
        place,
        days: dates.map((date) => ({
          date,
          items: own.filter((o) => o.date === date).sort((a, b) => a.start_time.localeCompare(b.start_time)),
        })),
      };
    });

/** Prochaine messe du jour après l'heure donnée (« HH:MM »), tous lieux confondus. */
export const nextMassToday = (occurrences: Occurrence[], today: string, now: string): Occurrence | undefined =>
  occurrences
    .filter((o) => o.kind === 'messe' && o.date === today && o.start_time.slice(0, 5) > now)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

export const PLACE_KINDS: Record<string, string> = {
  eglise_paroissiale: 'Église paroissiale',
  succursale: 'Succursale',
  chapelle: 'Chapelle',
  station: 'Station',
  sanctuaire: 'Sanctuaire',
};

const hhmm = (time: string) => time.slice(0, 5);

/** Messes à venir (à partir de « HH:MM » aujourd'hui), dans l'ordre chronologique. */
export const upcomingMasses = (occurrences: Occurrence[], today: string, now: string): Occurrence[] =>
  occurrences
    .filter((o) => o.kind === 'messe' && (o.date > today || (o.date === today && hhmm(o.start_time) >= now)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));

const EVENING = '17:00';

/** Mention sous l'heure d'un créneau : « passée », « ce soir », « aujourd'hui » ou « dim. 27 ». */
export const slotWhen = (o: Occurrence, today: string, now: string) => {
  if (o.date < today || (o.date === today && hhmm(o.start_time) < now)) return 'passée';
  if (o.date === today) return hhmm(o.start_time) >= EVENING ? 'ce soir' : 'aujourd’hui';
  return dayjs(o.date).format('ddd D');
};

/** « 9 h 30 (messe des étudiants) », « Confessions de 16 h à 18 h ». */
const itemText = (o: Occurrence) => {
  if (o.kind === 'messe') return `${formatTime(o.start_time)}${o.note ? ` (${o.note})` : ''}`;
  const kind = KIND_LABELS[o.kind] ?? o.kind;
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);
  return o.end_time ? `${label} de ${formatTime(o.start_time)} à ${formatTime(o.end_time)}` : `${label} à ${formatTime(o.start_time)}`;
};

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const rangeLabel = (days: number[]) => {
  const names = days.map((d) => WEEKDAYS[d]);
  if (names.length === 1) return capitalize(names[0] ?? '');
  if (names.length === 2) return capitalize(`${names[0]} et ${names[1]}`);
  return `Du ${names[0]} au ${names[names.length - 1]}`;
};

/**
 * Semaine type (fiche paroisse, « Chaque semaine ») : le dimanche, puis les jours de semaine,
 * les jours consécutifs aux horaires identiques regroupés (« Du lundi au vendredi »).
 */
export const weeklyRows = (occurrences: Occurrence[]): { label: string; text: string }[] => {
  const byDay = new Map<number, string>();
  for (const day of [0, 1, 2, 3, 4, 5, 6]) {
    const items = occurrences
      .filter((o) => dayjs(o.date).day() === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    if (items.length) byDay.set(day, items.map(itemText).join(', '));
  }
  const rows: { label: string; text: string }[] = [];
  const sunday = byDay.get(0);
  if (sunday) rows.push({ label: 'Dimanche', text: sunday });
  let run: number[] = [];
  const flush = () => {
    const text = run.length ? byDay.get(run[0] ?? -1) : undefined;
    if (text) rows.push({ label: rangeLabel(run), text });
    run = [];
  };
  for (const day of [1, 2, 3, 4, 5, 6]) {
    const text = byDay.get(day);
    const previous = run.length ? byDay.get(run[run.length - 1] ?? -1) : undefined;
    if (text && text === previous) run.push(day);
    else {
      flush();
      if (text) run = [day];
    }
  }
  flush();
  return rows;
};

/** « aujourd'hui à 18 h 30 », « demain à 7 h », « mardi à 7 h ». */
export const nextMassPhrase = (o: Occurrence, today: string) => {
  const day = o.date === today ? 'aujourd’hui' : dayjs(o.date).diff(dayjs(today), 'day') === 1 ? 'demain' : dayjs(o.date).format('dddd');
  return `${day} à ${formatTime(o.start_time)}`;
};
