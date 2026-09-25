import * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon } from './icon';

type FieldProps = {
  id: string;
  label: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  success?: React.ReactNode;
  counter?: { value: number; max: number };
  className?: string;
  /** Le contrôle ; reçoit id, aria-describedby et aria-invalid. */
  children: React.ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>;
};

/**
 * Champ de formulaire (DS-Composants §04) : label au-dessus, astérisque rouge pour
 * l'obligatoire, aide, erreur (bordure 2 px + icône) ou validation (vert canard).
 */
export const Field = ({ id, label, required, hint, error, success, counter, className, children }: FieldProps) => {
  const hintId = `${id}-aide`;
  const messageId = `${id}-message`;
  const describedBy = [error || success ? messageId : null, hint || counter ? hintId : null].filter(Boolean).join(' ');
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {required && (
          <>
            {' '}
            <span className="text-err" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (obligatoire)</span>
          </>
        )}
      </label>
      {React.cloneElement(children, {
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <p id={messageId} role="alert" className="m-0 flex items-center gap-2 text-sm text-err">
          <Icon name="alerte" size={16} />
          {error}
        </p>
      ) : success ? (
        <p id={messageId} className="m-0 flex items-center gap-2 text-sm text-ok">
          <Icon name="check" size={16} />
          {success}
        </p>
      ) : null}
      {(hint || counter) && (
        <p id={hintId} className="m-0 flex justify-between gap-4 text-sm text-ink-3">
          <span>{hint}</span>
          {counter && (
            <span className="tnum text-meta">
              {counter.value} / {counter.max}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

/** Classes communes des contrôles texte (48 px, fond surface, filet champ). */
export const controlClasses = (invalid?: boolean, valid?: boolean) =>
  cn(
    'w-full rounded border bg-surface px-3.5 text-body text-ink placeholder:text-ink-3 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3',
    invalid ? 'border-2 border-err' : valid ? 'border-ok' : 'border-line-field',
  );
