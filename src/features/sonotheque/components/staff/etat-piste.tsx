import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  Loader2,
  UploadCloud,
} from 'lucide-react';

import { StatusBadge, type StatusConfig } from '@/components/ui/status-badge';

import type { EtapeEnvoi } from '../../hooks/use-file-envoi';
import type { TrackStatus } from '../../types/schemas';

const ic = (I: typeof Clock, spin = false) => (
  <I className={spin ? 'animate-spin motion-reduce:animate-none' : undefined} />
);

/** États d'une piste côté staff (spec C2 §1) — icône + libellé, jamais la couleur seule. */
export function configEtat(
  etat: TrackStatus | EtapeEnvoi,
  pourcent?: number | null,
): StatusConfig {
  const pc = pourcent != null ? ` · ${Math.round(pourcent)} %` : '';
  switch (etat) {
    case 'brouillon':
      return { label: 'Brouillon', tone: 'neutral', icon: ic(FileEdit) };
    case 'attente':
      return { label: 'En attente d’envoi', tone: 'neutral', icon: ic(Clock) };
    case 'invalide':
      return { label: 'Refusé', tone: 'danger', icon: ic(AlertCircle) };
    case 'preparation':
      return {
        label: 'Préparation',
        tone: 'progress',
        icon: ic(Loader2, true),
      };
    case 'envoi':
      return { label: `Envoi${pc}`, tone: 'progress', icon: ic(UploadCloud) };
    case 'finalisation':
      return {
        label: 'Vérification',
        tone: 'progress',
        icon: ic(Loader2, true),
      };
    case 'en_file':
      return { label: 'En file', tone: 'info', icon: ic(Clock) };
    case 'encodage':
      return {
        label: `Encodage${pc}`,
        tone: 'progress',
        icon: ic(Loader2, true),
      };
    case 'pret':
      return { label: 'Prêt', tone: 'success', icon: ic(CheckCircle2) };
    case 'echec':
      return { label: 'Échec', tone: 'danger', icon: ic(AlertCircle) };
  }
}

export function EtatPiste({
  etat,
  pourcent,
}: {
  etat: TrackStatus | EtapeEnvoi;
  pourcent?: number | null;
}) {
  return <StatusBadge {...configEtat(etat, pourcent)} />;
}
