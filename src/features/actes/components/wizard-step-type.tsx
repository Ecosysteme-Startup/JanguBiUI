'use client';

import { useFormContext } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

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
      <legend className="p-0 text-sm font-semibold text-ink">
        Acte demandé <span className="text-err" aria-hidden="true">*</span>
      </legend>
      <p className="m-0 mt-1 text-sm text-ink-3">L’acte vous sera remis en original, signé et scellé par la paroisse.</p>
      <div className="mt-4 flex flex-col gap-2">
        {options.document_types.map((type) => {
          const checked = current === type.value;
          return (
            <label
              key={type.value}
              className={cn(
                'flex min-h-14 cursor-pointer items-center gap-4 rounded border px-4 py-3',
                checked ? 'border-primary bg-tint-50' : 'border-line bg-surface hover:border-ink',
              )}
            >
              <input type="radio" value={type.value} {...register('document_type', { onChange: () => choose(type.value) })} className="size-5 shrink-0" />
              <span className="text-body font-semibold text-ink">{type.label}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id="dt-err" role="alert" className="m-0 mt-2 flex items-center gap-2 text-sm text-err">
          <Icon name="alerte" size={16} />
          {error}
        </p>
      )}
      {options.document_types.find((t) => t.value === current)?.requires_precision && (
        <Field id="dt-libre" label="Précisez le document" required error={formState.errors.document_type_free?.message} className="mt-5">
          <Input {...register('document_type_free')} maxLength={255} />
        </Field>
      )}
    </fieldset>
  );
};
