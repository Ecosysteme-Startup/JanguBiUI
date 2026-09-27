import type { BadgeTone } from '@/components/ui/badge';
import type { IconName } from '@/components/ui/icon';
import { dayjs } from '@/utils/dates';

import type { Imperee, Payout } from '../../types/schemas';

const NBSP = ' ';

/** « 1er » pour le premier du mois, le quantième sinon. */
const day = (d: dayjs.Dayjs) => (d.date() === 1 ? '1er' : String(d.date()));

/** « 27 sept. » (insécable entre le jour et le mois). */
export const dayMonth = (iso: string) => {
  const d = dayjs(iso);
  return `${day(d)}${NBSP}${d.format('MMM')}`;
};

/** « Du 27 sept. au 4 oct. », « Du 18 au 25 oct. », « Le 22 nov. ». */
export const periodLabel = (
  from: string | null | undefined,
  to: string | null | undefined,
): string => {
  if (!from) return '';
  if (!to) return `Le ${dayMonth(from)}`;
  const a = dayjs(from);
  const b = dayjs(to);
  const sameMonth = a.month() === b.month() && a.year() === b.year();
  return `Du ${sameMonth ? day(a) : dayMonth(from)} au ${dayMonth(to)}`;
};

export type ImpereeState = { label: string; tone: BadgeTone; icon?: IconName };

/**
 * Statut affiché d'une quête impérée (WEB-DIO-Quetes-Imperees) : close, à venir (brouillon ou
 * date future) ou en cours.
 */
export const impereeState = (
  imperee: Pick<Imperee, 'status' | 'starts_on'>,
  today = dayjs(),
): ImpereeState => {
  if (imperee.status === 'clos')
    return { label: 'Close', tone: 'muted', icon: 'check' };
  if (
    imperee.status === 'brouillon' ||
    (imperee.starts_on && dayjs(imperee.starts_on).isAfter(today, 'day'))
  ) {
    return { label: 'À venir', tone: 'info' };
  }
  return { label: 'En cours', tone: 'ok' };
};

/** Quête sélectionnée par défaut : la première ouverte, sinon la première de la liste. */
export const defaultImperee = (list: Imperee[]): Imperee | undefined =>
  list.find((i) => i.status === 'ouvert') ?? list[0];

/** Statut d'un reversement (rapprochement au diocèse). */
export const PAYOUT_STATE: Record<
  NonNullable<Payout['status']>,
  { label: string; tone: BadgeTone }
> = {
  rapproche: { label: 'Rapproché', tone: 'ok' },
  ecart: { label: 'Écart', tone: 'warn' },
  recu: { label: 'À rapprocher', tone: 'info' },
};

/** Suivi par paroisse : collecte absente de Jàngu Bi pour cette paroisse. */
export const NOT_OPEN = 'non_ouverte';
