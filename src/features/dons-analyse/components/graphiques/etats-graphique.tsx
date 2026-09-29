import { AlertCircle, Lock } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/utils/cn';

const cadre =
  'flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background-surface px-6 py-8 text-center';

/**
 * Chargement : bloc calme, sans squelette qui clignote (03 §4.3). Les données
 * précédentes restent affichées pendant un changement de filtre.
 */
export function EtatChargement({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(cadre, 'min-h-[240px]', className)}
    >
      <p className="text-sm text-muted-foreground">Chargement des chiffres…</p>
    </div>
  );
}

export function EtatVide({
  titre = 'Aucun don sur cette période.',
  detail,
  className,
}: {
  titre?: string;
  detail?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(cadre, className)}>
      <p className="text-[15px] text-foreground/80">{titre}</p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function EtatErreur({
  interdit,
  className,
}: {
  interdit?: boolean;
  className?: string;
}) {
  const Icone = interdit ? Lock : AlertCircle;
  return (
    <div role="alert" className={cn(cadre, 'min-h-[200px]', className)}>
      <Icone aria-hidden="true" className="mb-1 size-5 text-muted-foreground" />
      <p className="text-[15px] text-foreground/80">
        {interdit
          ? "Cette vue n'est pas ouverte à votre compte."
          : 'Les chiffres ne sont pas disponibles pour le moment.'}
      </p>
      <p className="text-sm text-muted-foreground">
        {interdit
          ? 'Elle demande un droit donné par la paroisse ou le diocèse.'
          : 'Réessayez dans quelques instants.'}
      </p>
    </div>
  );
}
