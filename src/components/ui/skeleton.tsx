import { cn } from '@/utils/cn';

/** Squelette de chargement (WEB-Design-System) : surface2 à la forme du contenu (utilisable en 3G, ENF-F03). */
export const Skeleton = ({ className }: { className?: string }) => (
  <span aria-hidden="true" className={cn('block animate-pulse rounded-8 bg-surface-2', className)} />
);

export const LoadingBlock = ({ label = 'Chargement…', lines = 3 }: { label?: string; lines?: number }) => (
  <div role="status" className="flex flex-col gap-3">
    <span className="sr-only">{label}</span>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
);

/**
 * Ligne de texte factice : prend EXACTEMENT la hauteur de ligne de la classe typographique
 * passée (`text-20`, `text-13`…), pour que le squelette occupe la même place que le texte
 * chargé (CLS < 0,1). La barre grisée est un bloc en ligne : la boîte de ligne prend la hauteur de ligne du texte.
 */
export const SkeletonLine = ({ className, width = 'w-1/2' }: { className?: string; width?: string }) => (
  <span aria-hidden="true" className={cn('block', className)}>
    <span className={cn('inline-block h-[0.8em] animate-pulse rounded-6 bg-surface-2 align-middle', width)} />
  </span>
);

/** Piste de progression 6 px (surface2, remplissage b600), avec sa valeur pour le lecteur d'écran. */
export const Progress = ({ value, max = 100, label, className }: { value: number; max?: number; label: string; className?: string }) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={max}
    className={cn('h-1.5 overflow-hidden rounded-full bg-surface-2', className)}
  >
    <div className="h-1.5 origin-left animate-jb-grow rounded-full bg-primary-fill" style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }} />
  </div>
);
