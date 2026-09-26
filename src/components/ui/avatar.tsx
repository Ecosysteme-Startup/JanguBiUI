import { cn } from '@/utils/cn';

export const initialsOf = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** Avatar à initiales (pas de photo en V1). */
export const Avatar = ({ name, size = 32, className }: { name: string; size?: number; className?: string }) => (
  <span
    aria-hidden="true"
    style={{ width: size, height: size }}
    className={cn(
      'tnum inline-flex shrink-0 items-center justify-center rounded-full border border-primary-strong bg-tint-100 text-meta text-primary-strong',
      className,
    )}
  >
    {initialsOf(name)}
  </span>
);
