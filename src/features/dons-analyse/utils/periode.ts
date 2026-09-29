import type { Granularite } from '../api/get-analyse-dons';

/**
 * Complément de phrase d'après le libellé de période du serveur :
 * mois « septembre 2026 » → « en septembre » ; semaine « semaine du 21 au
 * 27 sept. 2026 » → « sur la semaine du… » ; trimestre « 3e trimestre 2026 »
 * → « au 3e trimestre 2026 » ; année « année 2026 » → « en 2026 ».
 */
export const enPeriode = (periode: {
  granularite: Granularite;
  libelle: string;
}): string => {
  switch (periode.granularite) {
    case 'mois':
      return `en ${periode.libelle.replace(/\s\d{4}$/, '')}`;
    case 'semaine':
      return `sur la ${periode.libelle}`;
    case 'trimestre':
      return `au ${periode.libelle}`;
    case 'annee':
      return `en ${periode.libelle.replace(/^année\s/, '')}`;
  }
};
