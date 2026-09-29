import { LITURGICAL_DOT, LiturgicalDot, type LiturgicalDotColor } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

/** Nom de la couleur liturgique (« Vert ») ; « Vert » par défaut pour une couleur inconnue. */
export const colorLabel = (color: string) => (LITURGICAL_DOT[color as LiturgicalDotColor] ?? LITURGICAL_DOT.vert).label;

/**
 * Étiquette liturgique des pages publiques (WEB-Accueil, WEB-Parole-du-jour) : pilule 24 px,
 * point de 8 px, 12/500. `children` remplace le nom de la couleur (« Temps ordinaire, couleur verte »).
 */
export const ColorTag = ({ color, children, className }: { color: string; children?: React.ReactNode; className?: string }) => (
  <span
    className={cn(
      'inline-flex h-6 shrink-0 items-center gap-1.5 self-start whitespace-nowrap rounded-full border border-line bg-surface px-2.5 text-12 font-medium text-ink-2',
      className,
    )}
  >
    <LiturgicalDot color={color} size={8} />
    {children ?? colorLabel(color)}
  </span>
);
