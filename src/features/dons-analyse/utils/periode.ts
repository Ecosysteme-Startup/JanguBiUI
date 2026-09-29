import type { Periode } from '../api/get-analyse-dons';

/**
 * Complément de phrase d'après le libellé de période du serveur :
 * mois « septembre 2026 » → « en septembre » ; semaine « semaine du 21 au
 * 27 sept. 2026 » → « sur la semaine du… » ; trimestre « 3e trimestre 2026 »
 * → « au 3e trimestre 2026 » ; année « année 2026 » → « en 2026 ».
 */
export const enPeriode = (periode: {
  type: Periode;
  libelle: string;
}): string => {
  switch (periode.type) {
    case 'mois':
      return `en ${periode.libelle.replace(/\s\d{4}$/, '')}`;
    case 'semaine':
      return periode.libelle.startsWith('semaine')
        ? `sur la ${periode.libelle}`
        : `sur la semaine ${periode.libelle}`;
    case 'trimestre':
      return `au ${periode.libelle}`;
    case 'annee':
      return `en ${periode.libelle.replace(/^année\s/, '')}`;
  }
};

/** Semaine ISO d'une date UTC : `2026-W39`. */
export const semaineIso = (date: Date): string => {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const jour = d.getUTCDay() || 7;
  // Jeudi de la même semaine : il fixe l'année ISO.
  d.setUTCDate(d.getUTCDate() + 4 - jour);
  const debutAnnee = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const numero = Math.ceil(
    ((d.getTime() - debutAnnee.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(numero).padStart(2, '0')}`;
};

/**
 * Paramètre `date` du contrat (§2.1) pour le mois de référence choisi à
 * l'écran : `mois` → `2026-09` ; `trimestre` → `2026-T3` ; `annee` → `2026` ;
 * `semaine` → la dernière semaine ISO du mois. Pour la période en cours, on
 * n'envoie rien : le serveur prend la période en cours.
 */
export const codePeriode = (
  periode: Periode,
  mois: string,
  moisCourant: string,
): string | undefined => {
  const [a, m] = mois.split('-').map(Number);
  if (mois === moisCourant) return undefined;
  switch (periode) {
    case 'mois':
      return mois;
    case 'trimestre':
      return `${a}-T${Math.ceil(m / 3)}`;
    case 'annee':
      return String(a);
    case 'semaine':
      return semaineIso(new Date(Date.UTC(a, m, 0)));
  }
};

/** Période en cours : l'instant de génération tombe entre ses bornes. */
export const periodeEnCours = (
  periode: { debut: string; fin: string },
  genereLe: string,
): boolean => {
  const jour = genereLe.slice(0, 10);
  return periode.debut <= jour && jour <= periode.fin;
};
