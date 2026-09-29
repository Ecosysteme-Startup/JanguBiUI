'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import type { ParishLifeValues } from './parish-life-form';

interface TypeDelayFieldsProps {
  /** Types d'actes réglables, dans l'ordre du formulaire (`type_delays`). */
  rows: { document_type: string; label: string }[];
  register: UseFormRegister<ParishLifeValues>;
  errors: FieldErrors<ParishLifeValues>;
  /** Délai appliqué quand un type n'a pas de délai propre (affiché en indication). */
  fallback: string;
  disabled: boolean;
}

/**
 * PAR-Parametres, « Actes délivrés » : délai indicatif propre à chaque type d'acte, prioritaire
 * sur le délai de la paroisse. Vide : le délai de la paroisse s'applique.
 */
export const TypeDelayFields = ({ rows, register, errors, fallback, disabled }: TypeDelayFieldsProps) => (
  <fieldset className="m-0 flex flex-col gap-3 border-0 p-0" aria-describedby="p-delais-aide">
    <legend className="mb-1 p-0 text-14 font-medium text-ink">Délai par type d&apos;acte</legend>
    <ul className="m-0 flex list-none flex-col p-0">
      {rows.map((row, index) => (
        <li key={row.document_type} className="border-b border-line py-3 last:border-b-0">
          <Field
            id={`p-delai-${row.document_type}`}
            label={
              <>
                <span className="sr-only">Délai, </span>
                {row.label}
                <span className="sr-only">, en jours ouvrés</span>
              </>
            }
            error={errors.type_delays?.[index]?.days?.message}
            className="grid grid-cols-[minmax(0,1fr)_64px] items-center gap-x-4 [&>label]:font-normal [&>p]:col-span-2"
          >
            <Input inputMode="numeric" controlSize="sm" className="tnum text-center text-15" placeholder={fallback} {...register(`type_delays.${index}.days`)} disabled={disabled} />
          </Field>
        </li>
      ))}
    </ul>
    <p id="p-delais-aide" className="m-0 text-13 text-ink-3">
      Jours ouvrés, affichés au fidèle. Un type laissé vide reprend le délai de la paroisse ({fallback} j).
    </p>
  </fieldset>
);
