import type { BadgeTone } from '@/components/ui/badge';
import { dayjs } from '@/utils/dates';

import type { Assignment } from '../api/get-assignments';

export type AssignmentBadge = { label: string; tone: BadgeTone; endingSoon: boolean };

/**
 * Badge de statut d'une nomination (WEB-DIO-Nominations) : « À venir » (proposée), « En vigueur »,
 * « Prend fin » (en vigueur, fin dans le mois en cours), « Échue » (terminée), « Annulée ».
 */
export const assignmentBadge = (a: Pick<Assignment, 'status' | 'end_date'>, now: dayjs.ConfigType = undefined): AssignmentBadge => {
  switch (a.status) {
    case 'proposee':
      return { label: 'À venir', tone: 'info', endingSoon: false };
    case 'terminee':
      return { label: 'Échue', tone: 'muted', endingSoon: false };
    case 'annulee':
      return { label: 'Annulée', tone: 'muted', endingSoon: false };
    default: {
      const endingSoon = Boolean(a.end_date && dayjs(a.end_date).isSame(dayjs(now), 'month') && !dayjs(a.end_date).isBefore(dayjs(now), 'day'));
      return endingSoon ? { label: 'Prend fin', tone: 'warn', endingSoon } : { label: 'En vigueur', tone: 'ok', endingSoon };
    }
  }
};
