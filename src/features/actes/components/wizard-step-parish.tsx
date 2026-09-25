'use client';

import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/utils/cn';

import { useSacramentParishes } from '../api/search-parishes';
import type { ParishValue, WizardValues } from '../utils/wizard-schema';

/** Étape 2 : la paroisse du SACREMENT (RG-02), cherchée dans l'annuaire public. */
export const WizardStepParish = () => {
  const { control, watch } = useFormContext<WizardValues>();
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 300);
  const { data, isFetching, isError } = useSacramentParishes(debounced);
  const value = watch('parish');
  const results = data?.results ?? [];
  const options: ParishValue[] = value && !results.some((p) => p.id === value.id) ? [value, ...results] : results;

  return (
    <Controller
      control={control}
      name="parish"
      render={({ field, fieldState }) => (
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="sr-only">Paroisse du sacrement</legend>
          <Notice title="La demande va à la paroisse où le sacrement a été célébré.">
            C’est elle qui tient le registre, même si vous suivez aujourd’hui une autre paroisse.
          </Notice>
          <Field id="dp-q" label="Nom de la paroisse, quartier ou ville" error={fieldState.error?.message} className="mt-6">
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Par exemple : Sainte-Thérèse, Grand-Dakar, Thiès"
              autoComplete="off"
            />
          </Field>
          {debounced.trim().length >= 2 && (
            <p className="tnum m-0 mb-3 mt-4 text-meta text-ink-3" aria-live="polite">
              {isFetching && !data ? 'Recherche…' : `${data?.count ?? 0} paroisse${(data?.count ?? 0) > 1 ? 's' : ''}`}
            </p>
          )}
          {isError && <p className="m-0 mt-3 text-sm text-err">La recherche n’a pas abouti. Réessayez.</p>}
          {isFetching && !data && <LoadingBlock lines={2} label="Recherche des paroisses…" />}
          {options.length > 0 && (
            <div role="radiogroup" aria-label="Paroisse du sacrement" className="mt-3 flex flex-col gap-2">
              {options.map((parish) => {
                const checked = field.value?.id === parish.id;
                return (
                  <label
                    key={parish.id}
                    className={cn(
                      'flex min-h-16 cursor-pointer items-center gap-4 rounded border px-4 py-3',
                      checked ? 'border-primary bg-tint-50' : 'border-line bg-surface hover:border-ink',
                    )}
                  >
                    <input
                      type="radio"
                      name="paroisse-sacrement"
                      checked={checked}
                      onChange={() => field.onChange({ id: parish.id, name: parish.name, city: parish.city, address: parish.address })}
                      className="size-5 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-semibold text-ink">{parish.name}</span>
                      {(parish.address || parish.city) && (
                        <span className="block text-sm text-ink-2">{[parish.address, parish.city].filter(Boolean).join(' · ')}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="m-0 mt-4 text-sm text-ink-3">
            Toutes les paroisses figurent dans l’annuaire, y compris celles qui n’ont pas encore rejoint Jàngu Bi.
          </p>
        </fieldset>
      )}
    />
  );
};
