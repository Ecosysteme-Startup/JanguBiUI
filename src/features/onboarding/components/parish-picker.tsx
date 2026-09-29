'use client';

import { useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/utils/cn';

import { type DirectoryParish, useDioceses, useParishChoices } from '../api/get-directory';

type ParishPickerProps = { value: DirectoryParish | null; onChange: (parish: DirectoryParish) => void; error?: string };

/** « Point E · doyenné Plateau-Médina », ou « Grand-Dakar · pas encore sur Jàngu Bi ». */
const subtitle = (parish: DirectoryParish) =>
  [parish.address || parish.city, parish.is_active_on_platform ? (parish.deanery_name ? `doyenné ${parish.deanery_name.replace(/^Doyenné\s+/i, '')}` : parish.diocese_name) : 'pas encore sur Jàngu Bi']
    .filter(Boolean)
    .join(' · ');

const pill = (active: boolean) =>
  cn(
    'hit inline-flex h-9 items-center rounded-full px-3.5 text-14',
    active ? 'bg-inverse font-semibold text-on-inverse' : 'border border-line bg-paper font-medium text-ink hover:border-line-field',
  );

/**
 * Étape 2 (WEB-Inscription-Paroisse) : recherche, filtre par diocèse, puis choix d'une paroisse
 * de l'annuaire (radiogroup) ; les paroisses ouvertes d'abord.
 */
export const ParishPicker = ({ value, onChange, error }: ParishPickerProps) => {
  const [q, setQ] = useState('');
  const [diocese, setDiocese] = useState('');
  const debounced = useDebounce(q.trim(), 300);
  const dioceses = useDioceses();
  const { data, isPending, isError } = useParishChoices({ q: debounced, diocese });
  const results = data?.results ?? [];
  const options = value && !results.some((p) => p.id === value.id) ? [value, ...results] : results;
  const dioceseName = dioceses.data?.find((d) => d.id === diocese)?.name;

  return (
    <fieldset className="m-0 mt-6 min-w-0 border-0 p-0">
      <legend className="sr-only">Paroisse suivie</legend>
      <Input
        type="search"
        icon="recherche"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Rechercher une paroisse : nom, quartier ou ville"
        placeholder="Paroisse, quartier ou ville"
        autoComplete="off"
      />
      {dioceses.data && dioceses.data.length > 1 && (
        <div role="group" aria-label="Diocèse" className="mt-3 flex flex-wrap gap-2">
          <button type="button" aria-pressed={diocese === ''} onClick={() => setDiocese('')} className={pill(diocese === '')}>
            Tous les diocèses
          </button>
          {dioceses.data.map((d) => (
            <button key={d.id} type="button" aria-pressed={diocese === d.id} onClick={() => setDiocese(d.id)} className={pill(diocese === d.id)}>
              {d.name}
            </button>
          ))}
        </div>
      )}
      <p className="tnum m-0 mt-5 flex justify-between gap-4 text-13 text-ink-3" aria-live="polite">
        <span>{dioceseName ? `${dioceseName}, présentes sur Jàngu Bi d’abord` : 'Présentes sur Jàngu Bi d’abord'}</span>
        {data && <span>{data.count > 1 ? `${data.count} paroisses` : `${data.count} paroisse`}</span>}
      </p>
      {error && (
        <p role="alert" className="m-0 mt-2 flex gap-1.5 text-13 text-err">
          <Icon name="erreur" size={14} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      {isError && <p className="m-0 mt-2 text-14 text-err">La liste des paroisses n&apos;a pas pu être chargée. Réessayez.</p>}
      {isPending ? (
        <div className="mt-2">
          <LoadingBlock lines={3} label="Chargement des paroisses…" />
        </div>
      ) : options.length === 0 ? (
        <p className="m-0 mt-2 rounded-16 border border-line px-4 py-4 text-14 text-ink-2">Aucune paroisse ne correspond à cette recherche.</p>
      ) : (
        <div role="radiogroup" aria-label="Paroisse" className="mt-2 max-h-[340px] overflow-y-auto rounded-16 border border-line">
          {options.map((parish, index) => {
            const checked = value?.id === parish.id;
            return (
              <label
                key={parish.id}
                className={cn(
                  'flex cursor-pointer gap-3.5 px-4 py-3.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-primary',
                  index < options.length - 1 && 'border-b border-line',
                  checked ? 'bg-tint-50' : 'hover:bg-surface',
                )}
              >
                <input
                  type="radio"
                  name="paroisse"
                  checked={checked}
                  onChange={() => onChange(parish)}
                  className="mt-px size-[22px] shrink-0 cursor-pointer appearance-none rounded-full border-1.5 border-line-field bg-paper checked:border-[6px] checked:border-primary-fill focus-visible:outline-none"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-16 font-semibold text-ink">{parish.name.replace(/^Paroisse\s+/i, '')}</span>
                  <span className="block text-14 text-ink-2">{subtitle(parish)}</span>
                  {parish.is_active_on_platform && (
                    <span className="mt-1 flex items-center gap-1.5 text-13 font-medium text-ok">
                      <Icon name="check" size={14} />
                      Horaires, annonces et prêtres sur Jàngu Bi
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
};
