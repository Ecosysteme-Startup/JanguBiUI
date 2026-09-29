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
      className={cn('px-4 py-3.5', f.etape === 'echec' && 'bg-destructive/5')}
    >
      <div className="flex items-start gap-3">
        <FileAudio
          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate font-medium text-foreground">
              {f.file.name}
            </p>
            <EtatPiste etat={f.publie ? 'pret' : f.etape} pourcent={pourcent} />
          </div>
          <p className="text-sm text-muted-foreground">{detail}</p>

          {f.etape === 'attente' && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <span className="shrink-0 text-muted-foreground">Titre</span>
              <input
                value={f.titre}
                onChange={(e) => onRenommer(e.target.value)}
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="size-full origin-left rounded-full bg-primary transition-transform duration-200 ease-out motion-reduce:transition-none"
                style={{ transform: `scaleX(${f.progression})` }}
              />
            </div>
          )}

          {(f.etape === 'en_file' || f.etape === 'encodage') && (
            <div
              className="mt-2 rounded-xl border border-border bg-background-surface p-3"
              aria-live="polite"
            >
              <p className="text-sm font-semibold text-foreground">
                {f.etape === 'encodage'
                  ? 'Encodage en cours'
                  : 'En file d’attente pour l’encodage'}
              </p>
              <EtapesEncodage track={f.track} />
            </div>
          )}

          {(f.etape === 'echec' || f.etape === 'invalide') && (
            <div role="alert" className="mt-2 text-sm">
              {f.etape === 'echec' && f.phaseEchec && (
                <p className="font-semibold text-destructive">
                  {PHASES[f.phaseEchec]}
                </p>
              )}
              <p className="text-foreground">{f.erreur}</p>
            </div>
          )}
        </div>
      </div>

      {(f.etape === 'echec' ||
        f.etape === 'invalide' ||
        f.etape === 'attente') && (
        <div className="mt-2 flex justify-end gap-2 pl-8">
          {f.etape === 'echec' && (
            <Button
              size="sm"
              onClick={onReessayer}
              icon={<RotateCcw className="size-3.5" aria-hidden />}
            >
              Réessayer
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetirer}
            icon={<X className="size-3.5" aria-hidden />}
            aria-label={`Retirer ${f.file.name}`}
          >
            Retirer
          </Button>
        </div>
      )}
    </li>
  );
}
