import { dayjs } from '@/utils/dates';

import type { PublicFund } from '../../types/schemas';
import { fcfa, fundKindLabel, progressPercent } from '../../utils/format';

const NBSP = ' ';

/** « 1er juin », « 4 octobre ». */
const dayMonth = (date: string) => {
  const d = dayjs(date);
  return `${d.date() === 1 ? '1er' : d.date()} ${d.format('MMMM')}`;
};

const isFullYear = (fund: PublicFund) =>
  Boolean(fund.starts_on && fund.ends_on) &&
  fund.starts_on!.endsWith('-01-01') &&
  fund.ends_on!.endsWith('-12-31') &&
  fund.starts_on!.slice(0, 4) === fund.ends_on!.slice(0, 4);

/** Période d'un fonds (WEB-FID-Donner) : « du 26 septembre au 4 octobre », « jusqu'au 31 décembre », « pour toute l'année 2026 ». */
export const fundPeriod = (fund: PublicFund): string | null => {
  if (isFullYear(fund))
    return `pour toute l’année ${fund.starts_on!.slice(0, 4)}`;
  if (fund.kind === 'campagne' && fund.ends_on)
    return `jusqu’au ${dayMonth(fund.ends_on)}`;
  if (fund.starts_on && fund.ends_on)
    return `du ${dayMonth(fund.starts_on)} au ${dayMonth(fund.ends_on)}`;
  if (fund.ends_on) return `jusqu’au ${dayMonth(fund.ends_on)}`;
  return null;
};

/** Ligne sous le titre d'une carte de fonds (espace fidèle). */
export const fundLine = (fund: PublicFund): string =>
  [fundKindLabel(fund.kind), fundPeriod(fund)].filter(Boolean).join(' · ');

/** Ligne compacte du parcours sans compte (WEB-Don-Paroisse) : échéance, ou avancement d'une campagne. */
export const fundLineCompact = (fund: PublicFund): string => {
  const kind = fundKindLabel(fund.kind);
  if (fund.kind === 'campagne' && fund.goal_amount) {
    return `${kind} · ${progressPercent(fund.raised, fund.goal_amount)}${NBSP}% de ${fcfa(fund.goal_amount)} réunis`;
  }
  return fund.ends_on ? `${kind} · jusqu’au ${dayMonth(fund.ends_on)}` : kind;
};

/** « Saint-Dominique » (sans le type) pour « 4 fonds ouverts à Saint-Dominique ». */
export const shortParishName = (name: string) =>
  name.replace(/^Paroisse\s+/i, '');

/** « Soutenir la paroisse Saint-Dominique ». */
export const supportTitle = (name: string) =>
  `Soutenir la paroisse ${shortParishName(name)}`;
