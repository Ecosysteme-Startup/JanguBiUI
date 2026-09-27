import * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon } from './icon';

type ChoiceProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  type?: 'checkbox' | 'radio';
  label: React.ReactNode;
  description?: React.ReactNode;
  /** `card` : choix en carte (bordure line, sélection b600 2 px sur fond b50, rayon 12). */
  variant?: 'plain' | 'card';
};

/**
 * Case à cocher (20 px, rayon 6, coche blanche sur b600) ou bouton radio (20 px, anneau b600
 * de 6 px) natifs, redessinés sans perdre le clavier ni le lecteur d'écran (WEB-Design-System).
 */
export const Choice = React.forwardRef<HTMLInputElement, ChoiceProps>(
  ({ type = 'checkbox', label, description, variant = 'plain', className, disabled, ...props }, ref) => (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2.5 text-15 text-ink',
        variant === 'card' &&
          'rounded-12 border border-line bg-paper px-3.5 py-3 has-[:checked]:border-primary has-[:checked]:bg-tint-50 has-[:checked]:ring-1 has-[:checked]:ring-inset has-[:checked]:ring-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
        disabled && 'cursor-not-allowed text-ink-3',
        className,
      )}
    >
      <span className="relative mt-0.5 inline-flex size-5 shrink-0">
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={cn(
            'peer size-5 shrink-0 cursor-pointer appearance-none border-1.5 border-line-field bg-paper transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2',
            type === 'checkbox'
              ? 'rounded-6 checked:border-primary-fill checked:bg-primary-fill'
              : 'rounded-full checked:border-[6px] checked:border-primary-fill',
            variant === 'card' && 'focus-visible:outline-none',
          )}
          {...props}
        />
        {type === 'checkbox' && (
          <Icon
            name="check"
            size={14}
            strokeWidth={3}
            className="pointer-events-none absolute left-[3px] top-[3px] hidden text-on-primary peer-checked:block"
          />
        )}
      </span>
      <span className="flex flex-col">
        <span className={cn('leading-5', variant === 'card' && 'font-semibold')}>{label}</span>
        {description && <span className="text-13 text-ink-2">{description}</span>}
      </span>
    </label>
  ),
);
Choice.displayName = 'Choice';
