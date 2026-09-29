export type ScheduleKind = 'messe' | 'confession' | 'adoration';

export const KIND_LABELS: Record<ScheduleKind, string> = { messe: 'Messe', confession: 'Confessions', adoration: 'Adoration' };
/** Avec article, pour les phrases (« Chevauche l'adoration… »). */
const KIND_ARTICLE: Record<ScheduleKind, string> = { messe: 'la messe', confession: 'les confessions', adoration: 'l’adoration' };

export const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const WEEKDAYS_SHORT = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

/** « 07:00:00 » ou « 07:00 » → « 7 h 00 ». */
export const formatTime = (time: string): string => {
  const [h, m] = time.split(':');
  return `${Number(h)} h ${m ?? '00'}`;
};

/** « 07:00:00 » → minutes depuis minuit. */
export const minutesOf = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

/** « 16:00:00 », « 18:00:00 » → « 16 h-18 h » ; sans fin → « 16 h 00 ». */
export const formatRange = (start: string, end: string | null): string => {
  if (!end) return formatTime(start);
  const short = (t: string) => {
    const [h, m] = t.split(':');
    return m && m !== '00' ? `${Number(h)} h ${m}` : `${Number(h)} h`;
  };
  return `${short(start)}-${short(end)}`;
};

/** Durée retenue pour un horaire sans fin : une heure (une messe de semaine). */
const DEFAULT_MINUTES = 60;

type Slot = { kind: ScheduleKind; weekday: number; start_time: string; end_time?: string | null };

const interval = (slot: Pick<Slot, 'start_time' | 'end_time'>) => {
  const start = minutesOf(slot.start_time);
  return [start, slot.end_time ? minutesOf(slot.end_time) : start + DEFAULT_MINUTES] as const;
};

/**
 * Premier horaire existant du même jour qui chevauche le nouveau créneau, avec le message
 * à afficher et le champ à corriger (règle de la maquette PAR-Horaires).
 */
export const findOverlap = (
  candidate: Omit<Slot, 'kind'>,
  existing: Slot[],
): { field: 'start' | 'end'; message: string } | null => {
  const [start, end] = interval(candidate);
  const clash = existing
    .filter((s) => s.weekday === candidate.weekday)
    .find((s) => {
      const [s0, s1] = interval(s);
      return start < s1 && s0 < end;
    });
  if (!clash) return null;
  const range = clash.end_time ? `de ${formatTime(clash.start_time)} à ${formatTime(clash.end_time)}` : `de ${formatTime(clash.start_time)}`;
  const base = `Chevauche ${KIND_ARTICLE[clash.kind]} ${range} le ${WEEKDAYS[clash.weekday].toLowerCase()}.`;
  if (start < minutesOf(clash.start_time)) {
    return { field: 'end', message: `${base} Terminez au plus tard à ${formatTime(clash.start_time)}.` };
  }
  return { field: 'start', message: base };
};

/** Nombre de messes par semaine d'un ensemble d'horaires. */
export const massesPerWeek = (slots: Pick<Slot, 'kind'>[]) => slots.filter((s) => s.kind === 'messe').length;

/** Heure des grilles et des listes (maquette PAR-Horaires) : « 07:00:00 » → « 7:00 ». */
export const clock = (time: string): string => {
  const [h, m] = time.split(':');
  return `${Number(h)}:${m ?? '00'}`;
};

/** Jour de la semaine d'une date ISO, lundi = 0 … dimanche = 6 (convention des horaires). */
export const weekdayOf = (isoDate: string): number => {
  const [y, mo, d] = isoDate.split('-').map(Number);
  return (new Date(Date.UTC(y, mo - 1, d)).getUTCDay() + 6) % 7;
};

type ExceptionLike = { id: number; date: string; kind: ScheduleKind; start_time: string | null };

/**
 * Prochaine exception qui touche un horaire de la semaine type : même célébration, même jour de
 * la semaine, et même heure (ou toute la journée quand l'exception n'a pas d'heure).
 */
export const exceptionForSlot = <E extends ExceptionLike>(slot: Pick<Slot, 'kind' | 'weekday' | 'start_time'>, exceptions: E[]): E | undefined =>
  [...exceptions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .find(
      (e) =>
        e.kind === slot.kind &&
        weekdayOf(e.date) === slot.weekday &&
        (e.start_time === null || minutesOf(e.start_time) === minutesOf(slot.start_time)),
    );
