import { Check, Circle, Loader2 } from 'lucide-react';

import { cn } from '@/utils/cn';

import type { StaffTrack } from '../../types/schemas';
import { formatDuree } from '../../utils/format';

const ETAPES = [
  {
    titre: 'Analyse du fichier',
    detail: (t?: StaffTrack) =>
      t?.duration_seconds
        ? `Durée ${formatDuree(t.duration_seconds)}`
        : 'Durée, format et étiquettes',
  },
  { titre: 'Normalisation du volume', detail: () => 'Ramené à −16 LUFS' },
  {
    titre: 'Encodage en 3 qualités',
    detail: () => 'Bas 32 kb/s · moyen 64 kb/s · haut 128 kb/s',
  },
  {
    titre: 'Forme d’onde et version hors ligne',
    detail: () => '200 points pour le lecteur, MP3 128 kb/s',
  },
];

type EtatEtape = 'fait' | 'en_cours' | 'a_venir' | 'inconnu';

/**
 * Les 4 étapes de l'encodage (plan §5.2). Le contrat B3 ne donne que l'état de
 * la piste ; si le backend expose `encoding_step`, l'étape courante est
 * marquée, sinon les étapes restent neutres pendant l'encodage.
 */
export function EtapesEncodage({
  track,
  termine,
}: {
  track?: StaffTrack;
  termine?: boolean;
}) {
  const pas = track?.encoding_step ?? null;
  const etat = (i: number): EtatEtape => {
    if (termine || track?.status === 'pret') return 'fait';
    if (track?.status !== 'encodage') return 'a_venir';
    if (pas == null) return 'inconnu';
    return i + 1 < pas ? 'fait' : i + 1 === pas ? 'en_cours' : 'a_venir';
  };
  return (
    <ol className="mt-3 space-y-2" aria-label="Étapes de l’encodage">
      {ETAPES.map((e, i) => {
        const s = etat(i);
        return (
          <li
            key={e.titre}
            data-etape={s}
            className="flex items-start gap-2.5 text-sm"
          >
            <span
              className={cn(
                'mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full',
                s === 'fait' && 'bg-success/15 text-success',
                s === 'en_cours' && 'bg-primary/10 text-primary',
                (s === 'a_venir' || s === 'inconnu') &&
                  'bg-muted text-muted-foreground',
              )}
              aria-hidden
            >
              {s === 'fait' ? (
                <Check className="size-3.5" />
              ) : s === 'en_cours' ? (
                <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
              ) : (
                <Circle className="size-2.5" />
              )}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block font-medium',
                  s === 'a_venir' ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {e.titre}
                <span className="sr-only">
                  {s === 'fait'
                    ? ' (terminé)'
                    : s === 'en_cours'
                      ? ' (en cours)'
                      : s === 'a_venir'
                        ? ' (à venir)'
                        : ''}
                </span>
              </span>
              <span className="block text-muted-foreground">
                {e.detail(track)}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
