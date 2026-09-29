import type { StatusTone } from '@/components/signature/status-dot';

import type { Declaration, DegreOrdre, EtatDeVie } from '../api/get-declaration';

export const ETAT_LABELS: Record<EtatDeVie, { court: string; long: string }> = {
  laic: { court: 'Fidèle laïc', long: 'Fidèle laïc' },
  clerc: { court: 'Clerc', long: 'Clerc (diacre, prêtre, évêque)' },
  consacre: { court: 'Consacré(e)', long: 'Consacré(e) (religieux, religieuse, vierge consacrée…)' },
};

export const DEGRE_LABELS: Record<DegreOrdre, string> = {
  aucun: 'Aucun',
  diacre_transitoire: 'Diacre (en vue du sacerdoce)',
  diacre_permanent: 'Diacre permanent',
  pretre: 'Prêtre',
  eveque: 'Évêque',
};

export type StatusView = { label: string; tone: StatusTone; detail: string };

/** Statut affiché : un laïc n'a rien à faire vérifier. */
export const statusOf = (d: Declaration): StatusView => {
  if (d.etat_de_vie === 'laic') {
    return { label: 'Aucune vérification nécessaire', tone: 'muted', detail: 'Un fidèle laïc n’a rien à faire vérifier.' };
  }
  switch (d.statut_verification) {
    case 'verifie':
      return { label: 'Vérifié', tone: 'ok', detail: 'La chancellerie a vérifié votre déclaration.' };
    case 'complement':
      return { label: 'Complément demandé', tone: 'warn', detail: 'La chancellerie attend un complément avant de vérifier.' };
    case 'rejete':
      return { label: 'Refusé', tone: 'err', detail: 'La chancellerie n’a pas pu vérifier votre déclaration.' };
    default:
      return { label: 'Déclaré · en attente de vérification', tone: 'primary', detail: 'La chancellerie examinera votre déclaration.' };
  }
};
