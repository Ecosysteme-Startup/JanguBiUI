import * as React from 'react';

import { cn } from '@/utils/cn';

type ChoiceProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  type?: 'checkbox' | 'radio';
  label: React.ReactNode;
  description?: React.ReactNode;
};

/** Case à cocher ou bouton radio natifs (20 px, accent bleu) avec leur libellé. */
export const Choice = React.forwardRef<HTMLInputElement, ChoiceProps>(
  ({ type = 'checkbox', label, description, className, ...props }, ref) => (
    <label className={cn('flex cursor-pointer items-start gap-3 text-body text-ink', className)}>
      <input ref={ref} type={type} className="mt-0.5 size-5 shrink-0" {...props} />
      <span className="flex flex-col gap-0.5">
        <span>{label}</span>
        {description && <span className="text-sm text-ink-3">{description}</span>}
      </span>
    </label>
  ),
);
Choice.displayName = 'Choice';
