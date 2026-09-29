'use client';

import { Lock } from 'lucide-react';

import { AjouterCetteParoisse } from '@/components/paroisses/ajouter-cette-paroisse';
import { usePlayerStore } from '@/lib/player/player-store';
import { cn } from '@/utils/cn';

/**
 * Lecture refusée (403 `reserve_paroissiens`, décision 4) : message sobre,
 * jamais culpabilisant, et « Ajouter cette paroisse ». Une fois la paroisse
 * ajoutée, la piste est relancée.
 */
export function PlayerReserve({
  className,
  compact = false,
}: {
  className?: string;
  /** Barre de lecture : action seule, le message est déjà en sous-titre. */
  compact?: boolean;
}) {
  const reserve = usePlayerStore((s) => s.reserve);
  const play = usePlayerStore((s) => s.play);
  if (!reserve) return null;
  const action = reserve.paroisse ? (
    <AjouterCetteParoisse
      paroisse={reserve.paroisse}
      size="sm"
      variant={compact ? 'outline' : 'primary'}
      className="rounded-full"
      onAjoutee={play}
    />
  ) : null;
  if (compact) return action;
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-3',
        className,
      )}
    >
      <Lock className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-14 font-medium text-ink">{reserve.message}</p>
        <p className="mt-0.5 text-13 leading-[18px] text-ink-3">
          {reserve.paroisse
            ? `Ajoutez ${reserve.paroisse.name} à vos paroisses pour l’écouter. Votre paroisse principale ne change pas.`
            : 'Cet enregistrement est réservé aux paroissiens.'}
        </p>
        {action && <div className="mt-2.5">{action}</div>}
      </div>
    </div>
  );
}
