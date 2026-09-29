'use client';

import { useFormContext } from 'react-hook-form';

import { Choice } from '@/components/ui/choice';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';

import type { RequestOptions } from '../api/get-request-options';
import type { WizardValues } from '../utils/wizard-schema';

/** Étape 1 : l'acte demandé. Changer d'acte efface un motif devenu incompatible. */
export const WizardStepType = ({ options }: { options: RequestOptions }) => {
  const { register, watch, setValue, getValues, formState } = useFormContext<WizardValues>();
  const current = watch('document_type');
  const error = formState.errors.document_type?.message;

  const choose = (value: string) => {
    const allowed = options.document_types.find((t) => t.value === value)?.allowed_reasons ?? [];
    if (getValues('reason') && !allowed.includes(getValues('reason'))) setValue('reason', '');
  };

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={error ? 'dt-err' : undefined}>
      <legend className="p-0 text-14 font-medium text-ink">
        Acte demandé <span className="text-err" aria-hidden="true">*</span>
      </legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.document_types.map((type) => (
          <Choice
            key={type.value}
            type="radio"
            variant="card"
            value={type.value}
            label={type.label}
            className="min-h-14 items-center"
            {...register('document_type', { onChange: () => choose(type.value) })}
          />
        ))}
      </div>
      {error && (
        <p id="dt-err" role="alert" className="m-0 mt-2 flex items-center gap-1.5 text-13 text-err">
          <Icon name="alerte" size={16} />
          {error}
        </p>
      )}
      {options.document_types.find((t) => t.value === current)?.requires_precision && (
        <Field id="dt-libre" label="Précisez le document" required error={formState.errors.document_type_free?.message} className="mt-5">
          <Input controlSize="md" {...register('document_type_free')} maxLength={255} />
        </Field>
      )}
    </fieldset>
  );
};
