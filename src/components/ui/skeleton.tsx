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
