import { cn } from '@/utils/cn';

export const initialsOf = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** Taille de police des initiales par diamètre (WEB-Design-System : 32 → 13, 40 → 15, 48 → 17). */
const fontFor = (size: number) => (size <= 24 ? 'text-11' : size <= 28 ? 'text-12' : size <= 36 ? 'text-13' : size <= 44 ? 'text-15' : 'text-17');

/** Avatar à initiales (pas de photo en V1) : initiales b800 en 600 sur b100, rond. */
export const Avatar = ({ name, size = 32, className }: { name: string; size?: number; className?: string }) => (
  <span
    aria-hidden="true"
    style={{ width: size, height: size }}
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-full bg-tint-100 font-semibold text-tint-800',
      fontFor(size),
      className,
    )}
  >
    {initialsOf(name)}
  </span>
);
