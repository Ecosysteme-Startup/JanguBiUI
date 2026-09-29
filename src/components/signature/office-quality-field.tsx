import * as React from 'react';

import { Choice } from '@/components/ui/choice';

export type OfficeQuality = { code: string; label: string };

type OfficeQualityFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> & {
  qualities: OfficeQuality[];
  error?: string;
  /** Mode contrôlé (hors React Hook Form) : qualité cochée et changement. */
  checkedValue?: string;
  onValueChange?: (quality: string) => void;
};

/**
 * Qualité du titulaire d'un office qui en a (« Curé » ou « Administrateur paroissial ») :
 * c'est le titre affiché partout pour la personne. Rien à choisir pour un office sans qualités.
 */
export const OfficeQualityField = React.forwardRef<HTMLInputElement, OfficeQualityFieldProps>(
  ({ qualities, error, id = 'qualite', checkedValue, onValueChange, ...inputProps }, ref) => {
    if (qualities.length === 0) return null;
    return (
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" aria-describedby={error ? `${id}-erreur` : undefined}>
        <legend className="mb-2 text-sm font-semibold text-ink">Qualité</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {qualities.map((q) => (
            <Choice
              key={q.code}
              ref={ref}
              type="radio"
              value={q.code}
              label={q.label}
              className="min-h-11 items-center"
              {...inputProps}
              {...(onValueChange ? { checked: checkedValue === q.code, onChange: () => onValueChange(q.code) } : {})}
            />
          ))}
        </div>
        {error && (
          <p id={`${id}-erreur`} className="m-0 text-sm text-err">
            {error}
          </p>
        )}
      </fieldset>
    );
  },
);
OfficeQualityField.displayName = 'OfficeQualityField';
