import * as React from 'react';

import { cn } from '@/utils/cn';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
};

/** Interrupteur 40 × 24 (WEB-Design-System) : un vrai bouton role="switch", libellé 15 à gauche. */
export const Switch = ({ checked, onCheckedChange, label, description, disabled, id }: SwitchProps) => {
  const autoId = React.useId();
  const labelId = `${id ?? autoId}-label`;
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex flex-col">
        <span id={labelId} className="text-15 text-ink">
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
          'hit h-6 w-10 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          checked ? 'bg-primary-fill' : 'border border-line-field bg-surface-2',
        )}
      >
        <span
          className={cn(
            'absolute rounded-full transition-[left]',
            checked ? 'left-[19px] top-[3px] size-[18px] bg-lit-white shadow-card' : 'left-[3px] top-[3px] size-4 bg-line-field',
          )}
        />
      </button>
    </div>
  );
};
