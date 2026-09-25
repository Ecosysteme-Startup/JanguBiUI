/** Capacités d'un office, en lecture (PAR-Equipe). Libellés du catalogue SRS §6.2. */
export const CAPABILITY_LABELS: Record<string, string> = {
  'structure.gerer': 'Structure',
  'horaires.gerer': 'Horaires',
  'offices.nommer': 'Nominations',
  'personnes.verifier': 'Vérifications',
  'annonces.publier': 'Annonces',
  'evenements.gerer': 'Événements',
  'actes.traiter': 'Actes',
  'actes.superviser': 'Supervision des actes',
  'messagerie.recevoir_fideles': 'Messagerie',
  'confessions.gerer': 'Confessions',
  'confessions.voir_planning': 'Planning des confessions',
  'tableau_bord.voir': 'Tableau de bord',
  'audit.voir': 'Journal',
  'plateforme.admin': 'Plateforme',
};

export const CapabilityChips = ({ capabilities }: { capabilities: string[] }) => (
  <ul aria-label="Capacités" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
    {capabilities.map((c) => (
      <li key={c} className="inline-flex h-6 items-center rounded border border-line px-2 text-xs text-ink-2">
        {CAPABILITY_LABELS[c] ?? c}
      </li>
    ))}
  </ul>
);
