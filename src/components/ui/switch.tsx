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

/** Interrupteur (DS-Composants §03) : un vrai bouton role="switch". */
export const Switch = ({ checked, onCheckedChange, label, description, disabled, id }: SwitchProps) => {
  const autoId = React.useId();
  const labelId = `${id ?? autoId}-label`;
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex flex-col">
        <span id={labelId} className="text-base text-ink">
          {label}
        </span>
        {description && <span className="text-sm text-ink-3">{description}</span>}
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
          'hit h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          checked ? 'bg-primary-fill' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] size-[18px] rounded-full bg-surface transition-[left]',
            checked ? 'left-[23px]' : 'left-[3px]',
          )}
        />
      </button>
    </div>
  );
};
