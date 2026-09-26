import { dayjs } from '@/utils/dates';

/**
 * Semaines (lundi → dimanche) couvrant le mois de `month`, jours ISO. Les jours des mois
 * voisins complètent la première et la dernière semaine.
 */
export const monthWeeks = (month: dayjs.ConfigType): string[][] => {
  const first = dayjs(month).startOf('month');
  const start = first.subtract((first.day() + 6) % 7, 'day');
  const last = first.endOf('month');
  const weeks: string[][] = [];
  for (let cursor = start; cursor.isBefore(last) || cursor.isSame(last, 'day'); cursor = cursor.add(7, 'day')) {
    weeks.push(Array.from({ length: 7 }, (_, i) => cursor.add(i, 'day').format('YYYY-MM-DD')));
  }
  return weeks;
};

/** « Octobre 2026 » */
export const monthTitle = (month: dayjs.ConfigType) => {
  const label = dayjs(month).format('MMMM YYYY');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Un événement touche-t-il ce jour ? (les événements sur plusieurs jours apparaissent chaque jour). */
export const onDay = (event: { start_at: string; end_at: string }, day: string) => {
  const d = dayjs(day);
  return !d.isBefore(dayjs(event.start_at), 'day') && !d.isAfter(dayjs(event.end_at), 'day');
};

export const inMonth = (event: { start_at: string; end_at: string }, month: dayjs.ConfigType) => {
  const m = dayjs(month);
  return !dayjs(event.end_at).isBefore(m.startOf('month')) && !dayjs(event.start_at).isAfter(m.endOf('month'));
};

/** Lundi de la semaine de `date`. */
export const weekStart = (date: dayjs.ConfigType) => {
  const d = dayjs(date).startOf('day');
  return d.subtract((d.day() + 6) % 7, 'day');
};

/** Les sept jours (lundi → dimanche) de la semaine de `date`, jours ISO. */
export const weekDays = (date: dayjs.ConfigType): string[] => {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'));
};

/** « Semaine du 5 au 11 octobre 2026 », « Semaine du 28 septembre au 4 octobre 2026 ». */
export const weekTitle = (date: dayjs.ConfigType) => {
  const start = weekStart(date);
  const end = start.add(6, 'day');
  const first = start.date() === 1 ? '1er' : String(start.date());
  const from = start.isSame(end, 'month') ? first : `${first} ${start.format('MMMM')}${start.isSame(end, 'year') ? '' : ` ${start.year()}`}`;
  return `Semaine du ${from} au ${end.date() === 1 ? '1er' : end.date()} ${end.format('MMMM YYYY')}`;
};

/** « du 28 septembre au 4 octobre » (libellés des boutons de navigation). */
export const weekRange = (date: dayjs.ConfigType) => {
  const start = weekStart(date);
  const end = start.add(6, 'day');
  return `du ${start.format('D MMMM')} au ${end.format('D MMMM')}`;
};

export const inWeek = (event: { start_at: string; end_at: string }, date: dayjs.ConfigType) => {
  const start = weekStart(date);
  return !dayjs(event.end_at).isBefore(start) && dayjs(event.start_at).isBefore(start.add(7, 'day'));
};

/** Un événement sur plusieurs jours s'affiche dans le bandeau « journée » de la vue semaine. */
export const spansDays = (event: { start_at: string; end_at: string }) => !dayjs(event.start_at).isSame(dayjs(event.end_at), 'day');

export type PlacedEvent<T> = { event: T; startMin: number; endMin: number; lane: number; lanes: number };

/** Plage horaire par défaut de la vue semaine, élargie aux événements qui en débordent. */
export const DEFAULT_HOURS = { from: 7, to: 21 } as const;

const minutesOf = (iso: string) => {
  const d = dayjs(iso);
  return d.hour() * 60 + d.minute();
};

/**
 * Événements d'un jour placés sur la grille horaire : minutes de début et de fin, et
 * colonne (« lane ») quand plusieurs se chevauchent. Les événements sur plusieurs jours
 * sont exclus (bandeau « journée »).
 */
export const placeDayEvents = <T extends { id: number; start_at: string; end_at: string }>(events: T[], day: string): PlacedEvent<T>[] => {
  const timed = events
    .filter((e) => !spansDays(e) && onDay(e, day))
    .map((event) => {
      const startMin = minutesOf(event.start_at);
      // Au moins une demi-heure à l'écran, même pour un événement sans durée.
      const endMin = Math.max(minutesOf(event.end_at), startMin + 30);
      return { event, startMin, endMin, lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.startMin - b.startMin || a.event.id - b.event.id);
  // Grappes d'événements qui se chevauchent : chacune partage sa largeur en colonnes.
  const placed: PlacedEvent<T>[] = [];
  let cluster: PlacedEvent<T>[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1));
    cluster.forEach((p) => placed.push({ ...p, lanes }));
    cluster = [];
  };
  for (const item of timed) {
    if (item.startMin >= clusterEnd) flush();
    const laneEnds = new Map<number, number>();
    cluster.forEach((p) => laneEnds.set(p.lane, Math.max(laneEnds.get(p.lane) ?? 0, p.endMin)));
    let lane = 0;
    while ((laneEnds.get(lane) ?? -1) > item.startMin) lane += 1;
    cluster.push({ ...item, lane });
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  flush();
  return placed;
};

/** Heures affichées : la plage par défaut, élargie pour contenir tous les événements placés. */
export const hourRange = (placed: { startMin: number; endMin: number }[]) => {
  const from = Math.min(DEFAULT_HOURS.from, ...placed.map((p) => Math.floor(p.startMin / 60)));
  const to = Math.max(DEFAULT_HOURS.to, ...placed.map((p) => Math.min(24, Math.ceil(p.endMin / 60))));
  return { from, to };
};
