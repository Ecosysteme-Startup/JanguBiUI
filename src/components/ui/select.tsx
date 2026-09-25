import * as React from 'react';

import { cn } from '@/utils/cn';

import { controlClasses } from './field';
import { Icon } from './icon';

/** Sélecteur natif (accessible, fiable sur Android Go) habillé à la charte. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(controlClasses(props['aria-invalid'] === true), 'h-12 appearance-none pr-11', className)}
        {...props}
      >
        {children}
      </select>
      <Icon name="chevron-bas" size={20} className="pointer-events-none absolute right-3.5 top-3.5 text-ink-2" />
    </div>
  ),
);
Select.displayName = 'Select';
