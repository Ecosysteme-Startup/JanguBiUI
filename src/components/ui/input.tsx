import * as React from 'react';

import { cn } from '@/utils/cn';

import { CONTROL_HEIGHT, type ControlSize, controlClasses } from './field';
import { Icon, type IconName } from './icon';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Valide : coche okT à droite du champ. */
  valid?: boolean;
  /** 52 (défaut, public), 48 (espace fidèle, fond surface), 44 (back-office), 36 (recherche compacte). */
  controlSize?: ControlSize;
  /** Icône à gauche (recherche). */
  icon?: IconName;
  /** Élément à droite (raccourci « Ctrl K », bouton œil…), posé dans le champ. */
  trailing?: React.ReactNode;
};

/** Champ texte (WEB-Design-System) : rayon 12, bordure lineField, focus b600 2 px, erreur errT 2 px. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, valid, controlSize = 'lg', icon, trailing, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        className={cn(
          controlClasses(props['aria-invalid'] === true, valid, controlSize),
          CONTROL_HEIGHT[controlSize],
          icon && (controlSize === 'lg' ? 'pl-12' : controlSize === 'xs' ? 'pl-10' : 'pl-11'),
          trailing && 'pr-20',
          className,
        )}
        {...props}
      />
    );
    if (!icon && !trailing && !valid) return input;
    return (
      <div className="relative w-full">
        {icon && (
          <Icon
            name={icon}
            size={controlSize === 'xs' ? 18 : 20}
            className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-3', controlSize === 'lg' ? 'left-4' : controlSize === 'xs' ? 'left-3' : 'left-3.5')}
          />
        )}
        {input}
        {trailing && <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center">{trailing}</span>}
        {valid && !trailing && props['aria-invalid'] !== true && (
          <Icon name="check" size={20} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ok" />
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

/** Raccourci clavier affiché dans un champ ou une barre (« Ctrl K », « Échap »). */
export const Kbd = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <kbd className={cn('rounded-6 border border-line bg-paper px-1.5 font-sans text-12 leading-5 text-ink-3', className)}>{children}</kbd>
);
