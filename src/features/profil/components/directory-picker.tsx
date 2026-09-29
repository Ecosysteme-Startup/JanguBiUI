'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

import { type DirectoryType, useSearchDirectory } from '../api/search-directory';

export type PickedNode = { id: string; name: string };

type DirectoryPickerProps = {
  id: string;
  label: string;
  type: DirectoryType;
  value: PickedNode | null;
  onChange: (node: PickedNode | null) => void;
  required?: boolean;
  error?: string;
  hint?: string;
};

/** Choix d'un diocèse ou d'un institut dans l'annuaire public (recherche par nom ou ville). */
export const DirectoryPicker = ({ id, label, type, value, onChange, required, error, hint }: DirectoryPickerProps) => {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 300);
  const { data, isError, isFetching } = useSearchDirectory(type, debounced);
  const results = data?.results ?? [];

  if (value) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-14 font-semibold text-ink">{label}</span>
        <div className="flex items-center justify-between gap-3 rounded-12 border border-line bg-surface px-4 py-3">
          <span className="text-15 text-ink">{value.name}</span>
          <Button variant="ghost" size="sm" onClick={() => onChange(null)} aria-label={`Changer : ${label.toLowerCase()}`}>
            Changer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Field id={id} label={label} required={required} error={error} hint={hint}>
        <Input controlSize="md" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" placeholder="Nom ou ville" />
      </Field>
      {isError && <p className="m-0 text-14 text-err">La recherche n’a pas abouti. Réessayez.</p>}
      {debounced.trim().length >= 2 && !isFetching && !isError && results.length === 0 && (
        <p className="m-0 text-14 text-ink-2">Aucun résultat pour « {debounced} ».</p>
      )}
      {results.length > 0 && (
        <ul aria-label={`Résultats : ${label.toLowerCase()}`} className="m-0 flex list-none flex-col gap-2 p-0">
          {results.map((node) => (
            <li key={node.id} className="flex items-center justify-between gap-3 rounded-12 border border-line bg-surface px-4 py-2">
              <span className="min-w-0">
                <span className="block text-15 text-ink">{node.name}</span>
                {node.city && <span className="block text-14 text-ink-2">{node.city}</span>}
              </span>
              <Button variant="outline" size="sm" onClick={() => onChange({ id: node.id, name: node.name })} aria-label={`Choisir ${node.name}`}>
                Choisir
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
