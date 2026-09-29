'use client';

import * as React from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

import { capitaliser, formatMois } from '../utils/format';

export interface OptionFiltre {
  valeur: string;
  libelle: string;
}

export interface FiltreListe {
  cle: string;
  /** Nom du filtre pour les lecteurs d'écran (« Fonds »). */
  nom: string;
  valeur: string;
  options: OptionFiltre[];
  onChange: (valeur: string) => void;
}

interface BarreFiltresProps<G extends string> {
  granularites: { valeur: G; libelle: string }[];
  granularite: G;
  onGranularite: (g: G) => void;
  /** Mois de référence `AAAA-MM`. */
  mois: string;
  onMois: (mois: string) => void;
  /** Dernier mois consultable (le mois en cours). */
  moisMax?: string;
  filtres: FiltreListe[];
  /** Élément à droite (Exporter, horodatage). */
  fin?: React.ReactNode;
  className?: string;
}

/** Décale un mois `AAAA-MM` de `delta` mois. */
export const decalerMois = (mois: string, delta: number): string => {
  const [a, m] = mois.split('-').map(Number);
  const t = a * 12 + (m - 1) + delta;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
};

/**
 * Barre de filtres analytique (spec 03 §3.2, §5.13) : une ligne, au-dessus de
 * tout ce qu'elle filtre. Périodes calées sur le calendrier.
 */
export function BarreFiltres<G extends string>({
  granularites,
  granularite,
  onGranularite,
  mois,
  onMois,
  moisMax,
  filtres,
  fin,
  className,
}: BarreFiltresProps<G>) {
  const suivantDesactive = moisMax ? mois >= moisMax : false;
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div
        role="group"
        aria-label="Période"
        className="inline-flex h-10 items-center gap-0.5 rounded-xl bg-surface-2 p-1"
      >
        {granularites.map((g) => (
          <button
            key={g.valeur}
            type="button"
            aria-pressed={g.valeur === granularite}
            onClick={() => onGranularite(g.valeur)}
            className={cn(
              'h-8 rounded-lg px-3 text-14 font-medium transition-colors',
              g.valeur === granularite
                ? 'bg-surface text-ink shadow-card'
                : 'text-ink-3 hover:text-ink',
            )}
          >
            {g.libelle}
          </button>
        ))}
      </div>
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          aria-label="Mois précédent"
          onClick={() => onMois(decalerMois(mois, -1))}
          className="flex size-8 items-center justify-center rounded-lg text-ink hover:bg-surface-2"
        >
          <Icon name="chevron-gauche" className="size-4" aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className="min-w-[132px] text-center text-14 font-semibold text-ink"
        >
          {capitaliser(formatMois(mois))}
        </span>
        <button
          type="button"
          aria-label="Mois suivant"
          disabled={suivantDesactive}
          onClick={() => onMois(decalerMois(mois, 1))}
          className="flex size-8 items-center justify-center rounded-lg text-ink hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Icon name="chevron-droite" className="size-4" aria-hidden="true" />
        </button>
      </div>
      {filtres.map((f) => (
        <label key={f.cle} className="relative">
          <span className="sr-only">{f.nom}</span>
          <select
            value={f.valeur}
            onChange={(e) => f.onChange(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-line bg-surface pl-3 pr-8 text-14 text-ink hover:border-line-strong"
          >
            {f.options.map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.libelle}
              </option>
            ))}
          </select>
          <Icon name="chevron-droite"
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 rotate-90 text-ink-3"
          />
        </label>
      ))}
      {fin && <div className="ml-auto flex items-center gap-3">{fin}</div>}
    </div>
  );
}
