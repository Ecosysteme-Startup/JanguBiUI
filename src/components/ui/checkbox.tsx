import * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon } from './icon';

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Nom accessible obligatoire : la case n'a pas de libellé visible. */
  label: string;
  /** Case partielle (en-tête de table quand une partie des rangées est cochée). */
  indeterminate?: boolean;
};

/**
 * Case à cocher nue pour les tables (WEB-PAR-Demandes) : 18 px rayon 5, cible de 44 px, libellé
 * uniquement pour le lecteur d'écran. Cochée ou partielle : aplat b600.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ label, indeterminate = false, className, ...props }, ref) => {
  const inner = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inner.current!);
  React.useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <span className={cn('hit relative inline-flex size-[18px] shrink-0', className)}>
      <input
        ref={inner}
        type="checkbox"
        aria-label={label}
        className="peer size-[18px] cursor-pointer appearance-none rounded-5 border-1.5 border-line-field bg-paper checked:border-primary-fill checked:bg-primary-fill indeterminate:border-primary-fill indeterminate:bg-primary-fill disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2"
        {...props}
      />
      <Icon
        name={indeterminate ? 'moins' : 'check'}
        size={12}
        strokeWidth={3}
        className="pointer-events-none absolute left-[3px] top-[3px] hidden text-on-primary peer-checked:block peer-indeterminate:block"
      />
    </span>
  );
});
Checkbox.displayName = 'Checkbox';
