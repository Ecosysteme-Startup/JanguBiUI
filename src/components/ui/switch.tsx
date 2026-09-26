import * as React from 'react';

import { cn } from '@/utils/cn';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  /** `md` 40 × 24, libellé 400 (design system) ; `lg` 44 × 26, libellé 500 (PAR-Annonce-Editeur, PAR-Parametres). */
  size?: 'md' | 'lg';
};

/** Interrupteur 40 × 24 (WEB-Design-System) : un vrai bouton role="switch", libellé 15 à gauche. */
export const Switch = ({ checked, onCheckedChange, label, description, disabled, id, size = 'md' }: SwitchProps) => {
  const autoId = React.useId();
  const labelId = `${id ?? autoId}-label`;
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex flex-col">
        <span id={labelId} className={cn('text-15 text-ink', size === 'lg' && 'font-medium')}>
          {label}
        </span>
        {description && <span className="text-13 text-ink-3">{description}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'hit shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          size === 'lg' ? 'h-[26px] w-11' : 'h-6 w-10',
          checked ? 'bg-primary-fill' : 'border border-line-field bg-surface-2',
        )}
      >
        <span
          className={cn(
            'absolute rounded-full transition-[left]',
            size === 'lg'
              ? checked
                ? 'left-[21px] top-[3px] size-5 bg-lit-white shadow-card'
                : 'left-[3px] top-[3px] size-[18px] bg-line-field'
              : checked
                ? 'left-[19px] top-[3px] size-[18px] bg-lit-white shadow-card'
                : 'left-[3px] top-[3px] size-4 bg-line-field',
          )}
        />
      </button>
    </div>
  );
};
