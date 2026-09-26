import * as React from 'react';

import { cn } from '@/utils/cn';

import { CONTROL_HEIGHT, type ControlSize, controlClasses } from './field';
import { Icon } from './icon';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { controlSize?: ControlSize };

/**
 * Sélecteur natif (accessible, fiable sur Android Go) habillé à la charte : même champ que
 * <Input>, chevrons haut-bas ink3 à droite (WEB-Design-System, « Select »).
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, controlSize = 'lg', ...props }, ref) => (
  <div className="relative w-full">
    <select
      ref={ref}
      className={cn(controlClasses(props['aria-invalid'] === true, false, controlSize), CONTROL_HEIGHT[controlSize], 'appearance-none pr-11', className)}
      {...props}
    >
      {children}
    </select>
    <Icon name="chevrons-haut-bas" size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
  </div>
));
Select.displayName = 'Select';
