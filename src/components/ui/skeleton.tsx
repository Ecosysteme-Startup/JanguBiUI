import { cn } from '@/utils/cn';

/** Squelette de chargement (utilisable en 3G, ENF-F03). */
export const Skeleton = ({ className }: { className?: string }) => (
  <span aria-hidden="true" className={cn('block animate-pulse rounded bg-surface-2', className)} />
);

export const LoadingBlock = ({ label = 'Chargement…', lines = 3 }: { label?: string; lines?: number }) => (
  <div role="status" className="flex flex-col gap-3">
    <span className="sr-only">{label}</span>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} className={cn('h-5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
);

/**
 * Ligne de texte factice : prend EXACTEMENT la hauteur de ligne de la classe typographique
 * passée (`text-h4`, `text-meta`…), pour que le squelette occupe la même place que le texte
 * chargé (CLS < 0,1). La barre grisée est un bloc en ligne : la boîte de ligne prend la hauteur de ligne du texte.
 */
export const SkeletonLine = ({ className, width = 'w-1/2' }: { className?: string; width?: string }) => (
  <span aria-hidden="true" className={cn('block', className)}>
    <span className={cn('inline-block h-[0.8em] animate-pulse rounded bg-surface-2 align-middle', width)} />
  </span>
);
