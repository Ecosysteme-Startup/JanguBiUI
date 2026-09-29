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

/**
 * Étiquettes de capacités (PAR-Equipe) : 22 px, rayon 6, surface2, 12/500 ink2. `max` : n premières,
 * le reste en « +n » (liste complète en infobulle et pour le lecteur d'écran).
 */
export const CapabilityChips = ({ capabilities, max }: { capabilities: string[]; max?: number }) => {
  const shown = max === undefined ? capabilities : capabilities.slice(0, max);
  const rest = max === undefined ? [] : capabilities.slice(max);
  const restLabels = rest.map((c) => CAPABILITY_LABELS[c] ?? c).join(', ');
  return (
    <span className="flex flex-wrap items-center gap-1">
      <ul aria-label="Capacités" className="m-0 flex list-none flex-wrap gap-1 p-0">
        {shown.map((c) => (
          <li key={c} className="inline-flex h-5.5 items-center whitespace-nowrap rounded-6 bg-surface-2 px-2 text-12 font-medium text-ink-2">
            {CAPABILITY_LABELS[c] ?? c}
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <span title={restLabels} className="tnum text-12 font-medium text-ink-3">
          +{rest.length}
          <span className="sr-only"> : {restLabels}</span>
        </span>
      )}
    </span>
  );
};
