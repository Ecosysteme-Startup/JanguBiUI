'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { useMesParoisses, useRechercheParoisses } from '@/lib/paroisses/api';

/** Paroisse choisie : nœud de la hiérarchie (UUID). */
export interface PickedParish {
  id: string;
  name: string;
  dioceseName: string;
}

interface ParishPickerProps {
  value: PickedParish | null;
  onChange: (parish: PickedParish | null) => void;
  disabled?: boolean;
}

const MIN_SEARCH_LENGTH = 2;

/**
 * Sélecteur de la paroisse du registre (demande d'acte, RG-02).
 *
 * Les paroisses du fidèle (`GET /me/paroisses/`) sont proposées en tête ; la
 * recherche couvre l'annuaire public (`GET /public/nodes/?q=&type=paroisse`),
 * car le sacrement a pu être célébré ailleurs.
 */
export function ParishPicker({ value, onChange, disabled }: ParishPickerProps) {
  const { data: mes = [] } = useMesParoisses();
  const [search, setSearch] = useState('');
  const trimmed = search.trim();

  const membershipParishes: PickedParish[] = mes.map((m) => ({
    id: m.paroisse.id,
    name: m.paroisse.name,
    dioceseName: m.paroisse.deanery_name ?? '',
  }));

  const { data: results = [], isFetching } = useRechercheParoisses(trimmed);

  const handleSearchPick = (parish: {
    id: string;
    name: string;
    diocese_name: string;
  }) => {
    onChange({
      id: parish.id,
      name: parish.name,
      dioceseName: parish.diocese_name,
    });
    setSearch('');
  };

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-primary bg-primary/5 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-primary">
            {value.name}
          </p>
          {value.dioceseName && (
            <p className="truncate text-xs text-muted-foreground">
              {value.dioceseName}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="h-auto shrink-0 p-0 text-xs font-medium underline"
        >
          Changer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {membershipParishes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Mes paroisses
          </p>
          <div className="flex flex-col gap-1.5">
            {membershipParishes.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(p)}
                disabled={disabled}
                className="flex flex-col items-start rounded-xl border border-border bg-card px-4 py-2.5 text-left hover:bg-muted disabled:opacity-50"
              >
                <span className="text-sm font-medium text-foreground">
                  {p.name}
                </span>
                {p.dioceseName && (
                  <span className="text-xs text-muted-foreground">
                    {p.dioceseName}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          aria-label="Rechercher une paroisse du registre"
          placeholder="Rechercher une autre paroisse (nom ou ville)…"
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {trimmed.length >= MIN_SEARCH_LENGTH && (
          <ul className="space-y-1.5" aria-label="Résultats de recherche">
            {isFetching && (
              <li className="p-1 text-xs text-muted-foreground">Recherche…</li>
            )}
            {!isFetching && results.length === 0 && (
              <li className="p-1 text-xs text-muted-foreground">
                Aucune paroisse trouvée.
              </li>
            )}
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() =>
                    handleSearchPick({
                      id: p.id,
                      name: p.name,
                      diocese_name: p.diocese_name ?? '',
                    })
                  }
                  disabled={disabled}
                  className="flex w-full flex-col items-start rounded-xl border border-border bg-card px-4 py-2.5 text-left hover:bg-muted disabled:opacity-50"
                >
                  <span className="text-sm font-medium text-foreground">
                    {p.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[p.city, p.diocese_name].filter(Boolean).join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
