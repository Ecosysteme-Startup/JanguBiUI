/** « dimanche 11 octobre » (date ISO `AAAA-MM-JJ`, lue en local). */
export const jourLong = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, j).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

/** « dim. 11 oct. » */
export const jourCourt = (iso: string | null | undefined): string => {
  if (!iso) return 'Pas de date';
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, j).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

/** Date locale du jour au format `AAAA-MM-JJ`. */
export const aujourdhuiIso = (maintenant = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${maintenant.getFullYear()}-${p(maintenant.getMonth() + 1)}-${p(maintenant.getDate())}`;
};

/** Ligne de suivi d'une intention côté fidèle. */
export const ligneSuivi = (i: {
  status: string;
  requested_date?: string | null;
  requested_mass: string;
  scheduled_date?: string | null;
  scheduled_mass: string;
  celebrated_at?: string | null;
  is_anonymous: boolean;
}): string => {
  const messe = (m: string) => (m ? `, ${m}` : '');
  switch (i.status) {
    case 'planifiee':
      return `Planifiée le ${jourLong(i.scheduled_date)}${messe(i.scheduled_mass)}`;
    case 'celebree':
      return `Célébrée le ${jourLong(i.celebrated_at ?? i.scheduled_date)}${messe(i.scheduled_mass)}`;
    case 'refusee':
      return `Demandée pour le ${jourLong(i.requested_date)}${messe(i.requested_mass)}`;
    case 'annulee':
      return 'Demande annulée';
    default:
      return `Souhaitée le ${jourLong(i.requested_date)}${messe(i.requested_mass)}${i.is_anonymous ? ' · anonyme' : ''}`;
  }
};
