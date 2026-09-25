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
