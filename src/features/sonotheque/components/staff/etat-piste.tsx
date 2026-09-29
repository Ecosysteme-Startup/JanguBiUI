import { Badge, type BadgeTone } from '@/components/ui/badge';
import type { IconName } from '@/components/ui/icon';

import type { EtapeEnvoi } from '../../hooks/use-file-envoi';
import type { TrackStatus } from '../../types/schemas';

type ConfigEtat = { label: string; tone: BadgeTone; icon: IconName };

/** États d'une piste côté staff (spec C2 §1) — icône + libellé, jamais la couleur seule. */
export function configEtat(
  etat: TrackStatus | EtapeEnvoi,
  pourcent?: number | null,
): ConfigEtat {
  const pc = pourcent != null ? ` · ${Math.round(pourcent)} %` : '';
  switch (etat) {
    case 'brouillon':
      return { label: 'Brouillon', tone: 'neutral', icon: 'crayon' };
    case 'attente':
      return { label: 'En attente d’envoi', tone: 'neutral', icon: 'horloge' };
    case 'invalide':
      return { label: 'Refusé', tone: 'err', icon: 'erreur' };
    case 'preparation':
      return { label: 'Préparation', tone: 'info', icon: 'chargement' };
    case 'envoi':
      return { label: `Envoi${pc}`, tone: 'info', icon: 'export' };
    case 'finalisation':
      return { label: 'Vérification', tone: 'info', icon: 'chargement' };
    case 'en_file':
      return { label: 'En file', tone: 'info', icon: 'horloge' };
    case 'encodage':
      return { label: `Encodage${pc}`, tone: 'info', icon: 'chargement' };
    case 'pret':
      return { label: 'Prêt', tone: 'ok', icon: 'succes' };
    case 'echec':
      return { label: 'Échec', tone: 'err', icon: 'erreur' };
  }
}

export function EtatPiste({
  etat,
  pourcent,
}: {
  etat: TrackStatus | EtapeEnvoi;
  pourcent?: number | null;
}) {
  const { label, tone, icon } = configEtat(etat, pourcent);
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
}
