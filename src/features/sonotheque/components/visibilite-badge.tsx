import { EyeOff, Globe, Lock } from 'lucide-react';

import { cn } from '@/utils/cn';

import type { Visibilite } from '../types/schemas';
import { LIBELLES_VISIBILITE } from '../utils/format';

const ICONES = { public: Globe, paroisse: Lock, prive: EyeOff } as const;

interface VisibiliteBadgeProps {
  visibilite: Visibilite;
  /** Nom de la paroisse : « Réservé aux paroissiens de Saint-Dominique ». */
  paroisse?: string | null;
  /** Libellé long (page d'album) plutôt que la pastille courte. */
  long?: boolean;
  className?: string;
}

/**
 * Visibilité d'un album ou d'une piste (spec C2 §1) : Public (globe),
 * Paroissiens (cadenas), Privé (œil barré, brouillon). L'icône double la
 * couleur (jamais le seul signal).
 */
export function VisibiliteBadge({
  visibilite,
  paroisse,
  long = false,
  className,
}: VisibiliteBadgeProps) {
  const Icone = ICONES[visibilite];
  const libelle =
    long && visibilite === 'paroisse'
      ? paroisse
        ? `Réservé aux paroissiens de ${paroisse}`
        : 'Réservé aux paroissiens'
      : long && visibilite === 'public'
        ? 'Accès libre'
        : long && visibilite === 'prive'
          ? 'Brouillon, visible par l’équipe'
          : LIBELLES_VISIBILITE[visibilite];
  return (
    <span
      data-visibilite={visibilite}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-13 font-semibold',
        visibilite === 'public'
          ? 'bg-tint-50 text-primary'
          : 'bg-surface-2 text-ink-3',
        className,
      )}
    >
      <Icone className="size-3.5" aria-hidden />
      {libelle}
    </span>
  );
}
