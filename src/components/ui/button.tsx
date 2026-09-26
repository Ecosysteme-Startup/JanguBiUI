import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon } from './icon';

/**
 * Boutons (WEB-Design-System, « Boutons ») : libellé 15/600, rayon 12 (10 en sm), sans ombre.
 * Variantes : primaire (b600, survol b700), secondaire (surface2), contour (bordure line),
 * discret (texte b600, survol b50), destructif (errBg / errT). Un seul primaire par écran.
 * Tailles : xl 52 (formulaires publics), lg 48, md 40 (défaut), sm 32 (tables, barres d'outils).
 *
 * Texte agrandi (A11Y-14) : hauteur minimale et non fixe, largeur plafonnée à celle du
 * conteneur. Cible tactile : `hit` agrandit la zone cliquable à 44 px sans changer le rendu.
 */
export const buttonVariants = cva(
  'inline-flex max-w-full shrink-0 items-center justify-center gap-2 rounded-12 border border-transparent text-center font-semibold transition-colors duration-150 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-fill text-on-primary hover:bg-primary-fill-hover hover:text-on-primary disabled:bg-surface-2 disabled:text-ink-4',
        secondary: 'bg-surface-2 text-ink hover:bg-line hover:text-ink disabled:bg-surface-2 disabled:text-ink-4',
        outline:
          'border-line bg-paper text-ink hover:border-line-field hover:bg-surface hover:text-ink disabled:border-line disabled:bg-paper disabled:text-ink-4',
        ghost: 'bg-transparent text-primary hover:bg-tint-50 hover:text-primary disabled:bg-transparent disabled:text-ink-4',
        danger: 'bg-err-bg text-err hover:border-err-line hover:text-err disabled:bg-surface-2 disabled:text-ink-4',
        /** Ancien nom (lien souligné) : rendu « discret ». */
        tertiary: 'bg-transparent text-primary hover:bg-tint-50 hover:text-primary disabled:bg-transparent disabled:text-ink-4',
        /** Ancien nom (bouton sur fond nuit) : rendu « contour ». */
        night:
          'border-line bg-paper text-ink hover:border-line-field hover:bg-surface hover:text-ink disabled:text-ink-4',
      },
      size: {
        xl: 'min-h-13 px-6 text-16',
        lg: 'min-h-12 px-5 text-16',
        md: 'hit min-h-10 px-4 text-15',
        sm: 'hit min-h-8 rounded-10 px-3 text-14',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Chargement : roue + libellé explicite (« Envoi en cours »), bouton inactif et `aria-busy`. */
    loading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, loading = false, type, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? 'button')}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      >
        {loading && <Icon name="chargement" size={18} className="animate-jb-spin" />}
        <Slottable>{children}</Slottable>
      </Comp>
    );
  },
);
Button.displayName = 'Button';
