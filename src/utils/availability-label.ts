import { dayjs, dotDate } from '@/utils/dates';

/** Disponibilité d'un prêtre joignable (`MessagingAvailability`, EF-PRE-07). */
export type ReplyWindowLike = { weekday: number; start: string; end: string };
export type AvailabilityLike = {
  accepts_new_conversations?: boolean;
  absent_until?: string | null;
  reply_windows?: ReplyWindowLike[];
  note?: string;
};

export const WEEKDAYS_SHORT = [
  'lun.',
  'mar.',
  'mer.',
  'jeu.',
  'ven.',
  'sam.',
  'dim.',
] as const;

/** « 09:00 » → « 9 h », « 16:30 » → « 16 h 30 ». */
export const clockLabel = (value: string) => {
  const [h = '0', m = '00'] = value.split(':');
  return m === '00' ? `${Number(h)} h` : `${Number(h)} h ${m}`;
};

/** « lun. 9 h-12 h et 16 h-19 h · sam. 9 h-12 h » */
export const windowsLabel = (windows: ReplyWindowLike[] = []) =>
  WEEKDAYS_SHORT.map((day, weekday) => {
    const ranges = windows
      .filter((w) => Number(w.weekday) === weekday)
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((w) => `${clockLabel(w.start)}-${clockLabel(w.end)}`);
    return ranges.length ? `${day} ${ranges.join(' et ')}` : null;
  })
    .filter(Boolean)
    .join(' · ');

export const isAbsent = (
  availability: AvailabilityLike | null | undefined,
  now = dayjs(),
) =>
  Boolean(
    availability?.absent_until &&
      dayjs(availability.absent_until).isAfter(now, 'day'),
  );

export type AvailabilityStatus = {
  tone: 'ok' | 'warn';
  label: string;
  detail: string | null;
};

/** Ce que voient les fidèles (FID-Pretres, PAR-Messagerie « Les fidèles voient »). */
export const availabilityStatus = (
  availability: AvailabilityLike | null | undefined,
): AvailabilityStatus => {
  if (availability && isAbsent(availability)) {
    return {
      tone: 'warn',
      label: `Absent jusqu’au ${dotDate(availability.absent_until!)}`,
      detail: 'messages lus à son retour',
    };
  }
  const windows = windowsLabel(availability?.reply_windows);
  const note = availability?.note?.trim() || null;
  return {
    tone: 'ok',
    label: 'Joignable',
    detail: windows ? `répond ${windows}` : note,
  };
};
