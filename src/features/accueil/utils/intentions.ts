import type { BadgeTone } from '@/components/ui/badge';
import type { IconName } from '@/components/ui/icon';
import { dayjs } from '@/utils/dates';

// Doublon assumé de la feature `intentions` (statuts et ligne de suivi) : pas d'import entre features.

/** Statuts du contrat : icône et libellé, la couleur n'est jamais le seul signal. */
export const INTENTION_STATUS: Record<string, { label: string; tone: BadgeTone; icon: IconName }> = {
  recue: { label: 'En attente', tone: 'warn', icon: 'horloge' },
  planifiee: { label: 'Planifiée', tone: 'info', icon: 'calendrier-ok' },
  refusee: { label: 'Refusée', tone: 'err', icon: 'x' },
  celebree: { label: 'Célébrée', tone: 'ok', icon: 'check' },
  annulee: { label: 'Annulée', tone: 'muted', icon: 'hors-service' },
};

/** « dimanche 11 octobre » (date ISO lue en local). */
const longDay = (iso: string | null | undefined) => (iso ? dayjs(iso.slice(0, 10)).format('dddd D MMMM') : '');

/** Ligne de suivi d'une intention : « Planifiée le lundi 2 novembre, Messe de 18 h 30 ». */
export const intentionFollowUp = (i: {
  status: string;
  requested_date?: string | null;
  requested_mass: string;
  scheduled_date?: string | null;
  scheduled_mass: string;
  celebrated_at?: string | null;
}): string => {
  const mass = (m: string) => (m ? `, ${m}` : '');
  switch (i.status) {
    case 'planifiee':
      return `Planifiée le ${longDay(i.scheduled_date)}${mass(i.scheduled_mass)}`;
    case 'celebree':
      return `Célébrée le ${longDay(i.celebrated_at ?? i.scheduled_date)}${mass(i.scheduled_mass)}`;
    case 'annulee':
      return 'Demande annulée';
    default:
      return i.requested_date ? `Souhaitée le ${longDay(i.requested_date)}${mass(i.requested_mass)}` : 'Pas de date précise';
  }
};
