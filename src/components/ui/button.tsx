import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

/**
 * Boutons (DS-Composants §01) : primaire, secondaire, tertiaire (lien souligné),
 * danger. Un seul bouton primaire par zone. Rayon 2 px, aucune ombre.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded border font-medium transition-colors duration-150 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'border-primary-fill bg-primary-fill text-on-primary hover:border-primary-fill-hover hover:bg-primary-fill-hover hover:text-on-primary disabled:border-line disabled:bg-surface-2 disabled:text-ink-3',
        secondary:
          'border-line-strong bg-transparent text-ink hover:bg-ink hover:text-paper disabled:border-line disabled:bg-transparent disabled:text-ink-3',
        tertiary:
          'h-auto border-0 bg-transparent px-0 text-primary underline decoration-1 underline-offset-[5px] hover:text-primary-strong hover:decoration-2 disabled:text-ink-3 disabled:decoration-line',
        danger:
          'border-err bg-transparent text-err hover:bg-err hover:text-on-primary disabled:border-line disabled:bg-transparent disabled:text-ink-3',
        night:
          'border-on-night bg-transparent text-on-night hover:bg-on-night hover:text-night',
      },
      size: {
        lg: 'h-13 px-7 text-body',
        md: 'h-11 px-5 text-base',
        sm: 'h-9 px-3.5 text-sm',
      },
      block: { true: 'w-full' },
    },
    compoundVariants: [{ variant: 'tertiary', class: 'h-11 px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
