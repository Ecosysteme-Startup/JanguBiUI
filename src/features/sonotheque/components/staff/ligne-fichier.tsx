'use client';

import { FileAudio, RotateCcw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

import type { FichierEnvoi } from '../../hooks/use-file-envoi';
import { formatTaille } from '../../utils/format';

import { EtapesEncodage } from './etapes-encodage';
import { EtatPiste } from './etat-piste';

const heure = (ms?: number) =>
  ms
    ? new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(ms))
    : '';

const PHASES = {
  preparation: 'L’envoi n’a pas pu commencer.',
  envoi: 'L’envoi s’est interrompu.',
  finalisation: 'Le fichier n’a pas été reçu en entier.',
  encodage: 'L’encodage a échoué.',
} as const;

interface LigneFichierProps {
  fichier: FichierEnvoi;
  onRetirer: () => void;
  onReessayer: () => void;
  onRenommer: (titre: string) => void;
}

export function LigneFichier({
  fichier: f,
  onRetirer,
  onReessayer,
  onRenommer,
}: LigneFichierProps) {
  const pourcent =
    f.etape === 'envoi'
      ? f.progression * 100
      : f.etape === 'encodage'
        ? (f.track?.encoding_percent ?? null)
        : null;
  const detail = (() => {
    const taille = formatTaille(f.file.size);
    if (f.etape === 'envoi') {
      const debit = f.debit ? ` · ${formatTaille(f.debit)}/s` : '';
      return `${taille} · ${formatTaille(f.octetsEnvoyes)} envoyés${debit}`;
    }
    if (f.envoyeA) return `${taille} · envoyé à ${heure(f.envoyeA)}`;
    if (f.etape === 'attente') return `${taille} · en attente d’envoi`;
    return taille;
  })();

  return (
    <li
      data-fichier={f.file.name}
      data-etape={f.etape}
      className={cn('px-4 py-3.5', f.etape === 'echec' && 'bg-err-bg')}
    >
      <div className="flex items-start gap-3">
        <FileAudio className="mt-0.5 size-5 shrink-0 text-ink-3" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate font-medium text-ink">{f.file.name}</p>
            <EtatPiste etat={f.publie ? 'pret' : f.etape} pourcent={pourcent} />
          </div>
          <p className="text-14 text-ink-3">{detail}</p>

          {f.etape === 'attente' && (
            <label className="mt-2 flex items-center gap-2 text-14">
              <span className="shrink-0 text-ink-3">Titre</span>
              <input
                value={f.titre}
                onChange={(e) => onRenommer(e.target.value)}
                className="h-8 min-w-0 flex-1 rounded-md border border-line-field bg-paper px-2 text-14 text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                aria-label={`Titre de ${f.file.name}`}
              />
            </label>
          )}

          {f.etape === 'envoi' && (
            <div
              role="progressbar"
              aria-label={`Envoi de ${f.file.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(f.progression * 100)}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
            >
              <div
                className="size-full origin-left rounded-full bg-primary-fill transition-transform duration-200 ease-out motion-reduce:transition-none"
                style={{ transform: `scaleX(${f.progression})` }}
              />
            </div>
          )}

          {(f.etape === 'en_file' || f.etape === 'encodage') && (
            <div
              className="mt-2 rounded-xl border border-line bg-surface p-3"
              aria-live="polite"
            >
              <p className="text-14 font-semibold text-ink">
                {f.etape === 'encodage'
                  ? 'Encodage en cours'
                  : 'En file d’attente pour l’encodage'}
              </p>
              <EtapesEncodage track={f.track} />
            </div>
          )}

          {(f.etape === 'echec' || f.etape === 'invalide') && (
            <div role="alert" className="mt-2 text-14">
              {f.etape === 'echec' && f.phaseEchec && (
                <p className="font-semibold text-err">{PHASES[f.phaseEchec]}</p>
              )}
              <p className="text-ink">{f.erreur}</p>
            </div>
          )}

          {f.etape === 'echec' &&
            f.phaseEchec === 'encodage' &&
            f.track?.status === 'echec' && <EtapesEncodage track={f.track} />}
        </div>
      </div>

      {(f.etape === 'echec' ||
        f.etape === 'invalide' ||
        f.etape === 'attente') && (
        <div className="mt-2 flex justify-end gap-2 pl-8">
          {f.etape === 'echec' && (
            <Button size="sm" onClick={onReessayer}>
              <RotateCcw className="size-3.5" aria-hidden />
              Réessayer
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetirer}
            aria-label={`Retirer ${f.file.name}`}
          >
            <X className="size-3.5" aria-hidden />
            Retirer
          </Button>
        </div>
      )}
    </li>
  );
}
