import type { LiturgyDayFull } from '../api/get-liturgy-day';

const RANKS: Record<string, string> = {
  solennite: 'Solennité',
  fete_du_seigneur: 'Fête du Seigneur',
  fete: 'Fête',
  memoire: 'Mémoire',
  dimanche: 'Dimanche',
  ferie: 'Férie',
};

/** « Férie · année paire · dimanche : année A » (sous le titre du jour). */
export const calendarMeta = (calendar: LiturgyDayFull['calendar']) =>
  [
    calendar.rank ? (RANKS[calendar.rank] ?? calendar.rank) : null,
    calendar.weekday_cycle ? `semaine : année ${calendar.weekday_cycle === 'II' ? 'paire' : 'impaire'}` : null,
    calendar.sunday_cycle ? `dimanche : année ${calendar.sunday_cycle}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

/** Nom court d'un jour pour une grille (« Férie », « 26e dimanche (A) »…). */
export const shortCelebration = (calendar: LiturgyDayFull['calendar']) => {
  if (calendar.rank === 'ferie') return 'Férie';
  const sunday = /^(\d+e) dimanche/i.exec(calendar.celebration);
  if (sunday && calendar.sunday_cycle) return `${sunday[1]} dimanche (${calendar.sunday_cycle})`;
  return calendar.celebration;
};
