import type { Occurrence, ParishWeek, WeekPlace } from '../api/get-parish-week';

export const KIND_LABEL: Record<string, string> = { messe: 'Messe', confession: 'Confessions', adoration: 'Adoration' };

/** « 18:30:00 » → « 18 h 30 », « 07:00:00 » → « 7 h » */
export const timeLabel = (time: string) => {
  const [h = '0', m = '00'] = time.split(':');
  return m === '00' ? `${Number(h)} h` : `${Number(h)} h ${m}`;
};

/** « 16 h-18 h » pour une plage, sinon l'heure de début. */
export const rangeLabel = (o: Pick<Occurrence, 'start_time' | 'end_time'>) =>
  o.end_time ? `${timeLabel(o.start_time)}-${timeLabel(o.end_time)}` : timeLabel(o.start_time);

const at = (o: Occurrence) => new Date(`${o.date}T${o.start_time}`);

/** Prochaine occurrence d'un type (messe, confession) à partir de `now`. */
export const nextOccurrence = (week: ParishWeek | undefined, kind: string, now: Date) =>
  week?.occurrences
    .filter((o) => o.kind === kind && at(o) >= now)
    .sort((a, b) => at(a).getTime() - at(b).getTime())[0];

export type PlaceSchedule = { place: WeekPlace; days: { date: string; items: Occurrence[] }[] };

/** Horaires regroupés par lieu (lieu principal d'abord), puis par jour. Lieux sans horaire omis. */
export const scheduleByPlace = (week: ParishWeek): PlaceSchedule[] =>
  [...week.places]
    .sort((a, b) => Number(Boolean(b.is_main)) - Number(Boolean(a.is_main)))
    .map((place) => {
      const own = week.occurrences.filter((o) => o.place_id === place.id).sort((a, b) => at(a).getTime() - at(b).getTime());
      const dates = [...new Set(own.map((o) => o.date))];
      return { place, days: dates.map((date) => ({ date, items: own.filter((o) => o.date === date) })) };
    })
    .filter((s) => s.days.length > 0);
