import { dayjs } from '@/utils/dates';

import type { Slot } from '../api/schemas';

import { DAY_FORMAT } from './week';

/** Premier jour à venir avec des créneaux libres, et ce qu'on peut en dire sans rien inventer. */
export const nextConfessionDay = (slots: Slot[]) => {
  const first = [...slots].sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  if (!first) return null;
  const day = dayjs(first.starts_at).format(DAY_FORMAT);
  const ofDay = slots.filter((s) => dayjs(s.starts_at).format(DAY_FORMAT) === day);
  const starts = ofDay.map((s) => s.starts_at).sort();
  const ends = ofDay.map((s) => s.ends_at).sort();
  const minutes = dayjs(first.ends_at).diff(dayjs(first.starts_at), 'minute');
  return { day, from: starts[0], to: ends.at(-1)!, place: first.place.name, minutes };
};
