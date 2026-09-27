import { dayjs } from '@/utils/dates';

import type { PlanningSlot } from '../api/schemas';

export const DAY_FORMAT = 'YYYY-MM-DD';
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const weekStartOf = (d: dayjs.ConfigType) =>
  dayjs(d).startOf('week').format(DAY_FORMAT);
export const weekDays = (weekStart: string) =>
  Array.from({ length: 7 }, (_, i) =>
    dayjs(weekStart).add(i, 'day').format(DAY_FORMAT),
  );
export const dayOf = (slot: PlanningSlot) =>
  dayjs(slot.starts_at).format(DAY_FORMAT);
export const dayTitle = (d: dayjs.ConfigType) =>
  capitalize(dayjs(d).format('dddd D MMMM'));

export const weekLabel = (weekStart: string) => {
  const start = dayjs(weekStart);
  const end = start.add(6, 'day');
  return start.month() === end.month()
    ? `Semaine du ${start.format('D')} au ${end.format('D MMMM')}`
    : `Semaine du ${start.format('D MMMM')} au ${end.format('D MMMM')}`;
};

export const isBooked = (slot: PlanningSlot) =>
  slot.booking !== null && slot.status === 'reserve';

/** Regroupe les créneaux d'un jour par prêtre, les miens en premier. */
export const byPriest = (slots: PlanningSlot[]) => {
  const groups = new Map<
    string,
    { priestId: string; name: string; mine: boolean; slots: PlanningSlot[] }
  >();
  slots.forEach((slot) => {
    const group = groups.get(slot.priest_id) ?? {
      priestId: slot.priest_id,
      name: slot.priest_name,
      mine: slot.is_mine,
      slots: [],
    };
    groups.set(slot.priest_id, { ...group, slots: [...group.slots, slot] });
  });
  return [...groups.values()].sort(
    (a, b) => Number(b.mine) - Number(a.mine) || a.name.localeCompare(b.name),
  );
};

/** « A. D. » ou nom complet : ce que le serveur a choisi de montrer. Pastille : deux lettres. */
export const badgeOf = (person: string) =>
  person
    .replace(/\./g, '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

const clock = (iso: string) => dayjs(iso).format('HH:mm');

/** Heures de début des créneaux d'un jour (colonnes de la grille), triées, sans doublon. */
export const timeColumns = (slots: PlanningSlot[]) => [...new Set(slots.map((s) => clock(s.starts_at)))].sort();

/** « 16:00 – 18:00 » : du premier début à la dernière fin. */
export const dayRange = (slots: PlanningSlot[]) => {
  if (slots.length === 0) return '';
  // Heures du jour comparées entre elles : la plage vaut aussi sur plusieurs jours.
  const starts = slots.map((s) => clock(s.starts_at)).sort();
  const ends = slots.map((s) => clock(s.ends_at)).sort();
  return `${starts[0]} – ${ends[ends.length - 1]}`;
};

/** Durée la plus fréquente d'un créneau, en minutes. */
export const slotMinutes = (slots: PlanningSlot[]): number | null => {
  const counts = new Map<number, number>();
  slots.forEach((s) => {
    const minutes = dayjs(s.ends_at).diff(dayjs(s.starts_at), 'minute');
    counts.set(minutes, (counts.get(minutes) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

export type UpcomingDay = { day: string; range: string; open: number; booked: number };

/** Jours ouverts après `afterDay` (section « Jours suivants »). */
export const upcomingDays = (slots: PlanningSlot[], afterDay: string): UpcomingDay[] => {
  const byDay = new Map<string, PlanningSlot[]>();
  slots
    .filter((s) => dayOf(s) > afterDay)
    .forEach((s) => byDay.set(dayOf(s), [...(byDay.get(dayOf(s)) ?? []), s]));
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, ofDay]) => ({
      day,
      range: dayRange(ofDay),
      open: ofDay.filter((s) => s.status !== 'bloque').length,
      booked: ofDay.filter(isBooked).length,
    }));
};

/** Plage habituelle : le jour de semaine le plus ouvert, et sa plage la plus large. */
export const usualSchedule = (slots: PlanningSlot[]): { weekday: string; range: string } | null => {
  const open = slots.filter((s) => s.status !== 'bloque');
  if (open.length === 0) return null;
  const counts = new Map<number, number>();
  open.forEach((s) => counts.set(dayjs(s.starts_at).day(), (counts.get(dayjs(s.starts_at).day()) ?? 0) + 1));
  const weekday = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const ofWeekday = open.filter((s) => dayjs(s.starts_at).day() === weekday);
  return { weekday: dayjs(ofWeekday[0].starts_at).format('dddd'), range: dayRange(ofWeekday) };
};

/** « Abbé A. Ndiaye » → « A. Ndiaye » : les initiales de l'avatar ne prennent pas le titre. */
export const withoutTitle = (name: string) => name.replace(/^(abbé|père|mgr|monseigneur|frère|sœur|diacre)\s+/i, '');
