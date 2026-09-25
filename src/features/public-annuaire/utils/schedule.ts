import type { Occurrence, Place } from '../api/get-node-week';

const KIND_LABELS: Record<string, string> = { messe: 'messe', confession: 'confessions', adoration: 'adoration' };

/** « 7 h 30 », « 18 h » depuis « HH:MM[:SS] ». */
export const formatTime = (time: string) => {
  const [h, m] = time.split(':');
  const hours = Number(h);
  return m && m !== '00' ? `${hours} h ${m}` : `${hours} h`;
};

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
