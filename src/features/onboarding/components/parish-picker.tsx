'use client';

import { useState } from 'react';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/utils/cn';

import { type Parish, useSearchParishes } from '../api/search-parishes';

type ParishPickerProps = { value: Parish | null; onChange: (parish: Parish) => void; error?: string };

/** Étape 2 : recherche dans l'annuaire public et choix d'une paroisse (radiogroup). */
export const ParishPicker = ({ value, onChange, error }: ParishPickerProps) => {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 300);
  const { data, isFetching, isError } = useSearchParishes(debounced);
  const results = data?.results ?? [];
  const options = value && !results.some((p) => p.id === value.id) ? [value, ...results] : results;

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="p-0 text-sm font-semibold text-ink">Rechercher une paroisse</legend>
      <Field id="p-q" label="Nom, quartier ou ville" error={error} className="mt-3">
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Par exemple : Point E, Thiès, Saint-Joseph" autoComplete="off" />
      </Field>
      {debounced.trim().length >= 2 && (
        <p className="tnum mb-3 mt-4 flex justify-between text-meta text-ink-3" aria-live="polite">
          <span>{isFetching && !data ? 'Recherche…' : `${data?.count ?? 0} résultat${(data?.count ?? 0) > 1 ? 's' : ''}`}</span>
          <span>Actives en premier</span>
        </p>
      )}
      {isError && <p className="text-sm text-err">La recherche n&apos;a pas abouti. Réessayez.</p>}
      {isFetching && !data && <LoadingBlock lines={2} />}
      {options.length > 0 && (
        <div role="radiogroup" aria-label="Paroisse suivie" className="flex flex-col gap-2">
          {options.map((parish) => {
            const checked = value?.id === parish.id;
            return (
              <label
                key={parish.id}
                className={cn(
                  'flex min-h-16 cursor-pointer items-center gap-4 rounded border px-4 py-3',
                  checked ? 'border-primary bg-tint-50' : 'border-line bg-surface hover:border-ink',
                )}
              >
                <input type="radio" name="paroisse" checked={checked} onChange={() => onChange(parish)} className="size-5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold text-ink">{parish.name}</span>
                  {(parish.city || parish.address) && <span className="block text-sm text-ink-2">{[parish.address, parish.city].filter(Boolean).join(' · ')}</span>}
                </span>
                <span className={cn('inline-flex items-center gap-2 whitespace-nowrap text-sm', parish.is_active_on_platform && 'font-semibold text-primary')}>
                  <span aria-hidden="true" className={cn('inline-block size-2 rounded-full', parish.is_active_on_platform ? 'bg-primary' : 'border-[1.5px] border-primary')} />
                  {parish.is_active_on_platform ? 'Active' : 'En préparation'}
                </span>
              </label>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-sm text-ink-3">
        Une paroisse « en préparation » peut être suivie : vous verrez ses horaires, et ses annonces dès son ouverture.
      </p>
    </fieldset>
  );
};
