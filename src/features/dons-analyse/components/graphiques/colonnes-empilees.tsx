'use client';

import * as React from 'react';

import { cn } from '@/utils/cn';

import { formatNombre, formatPourcent } from '../../utils/format';

import { graduations } from './echelle';
import { Infobulle } from './infobulle';
import { Legende } from './legende';

export interface SerieColonnes {
  cle: string;
  libelle: string;
  couleur: string;
}

export interface PeriodeColonnes {
  cle: string;
  libelle: string;
  sousLibelle?: string;
  /** En-tête de l'infobulle (« Semaine du 21 au 27 sept. »). */
  titreInfobulle: string;
  valeurs: Record<string, number | undefined>;
}

interface ColonnesEmpileesProps {
  periodes: PeriodeColonnes[];
  series: SerieColonnes[];
  /** `pourcent` : chaque colonne vaut 100 % de sa période (statuts). */
  mode?: 'valeur' | 'pourcent';
  /** Unité de l'axe (1000 = milliers, précisé dans le sous-titre de la carte). */
  diviseur?: number;
  formatValeur?: (n: number) => string;
  /** Étiquette directe : total de la dernière période, de toutes, ou aucune. */
  etiquettes?: 'derniere' | 'toutes' | 'aucune';
  /** Résumé du message, pour `aria-label`. */
  resume: string;
  /** Libellé de la ligne de total de l'infobulle. */
  libelleTotal?: (total: number, periode: PeriodeColonnes) => string;
  hauteur?: number;
  legende?: boolean;
  /** Période survolée au rendu initial (index). */
  activeInitiale?: number | null;
  className?: string;
}

/**
 * Colonnes empilées (spec 03 §5.3) : colonnes HTML de 24 px, segments dans
 * l'ordre des séries de bas en haut, écart de 2 px, rayon en haut seulement.
 * Toute la plage est la cible de survol et de focus.
 */
export function ColonnesEmpilees({
  periodes,
  series,
  mode = 'valeur',
  diviseur = 1,
  formatValeur = formatNombre,
  etiquettes = 'derniere',
  resume,
  libelleTotal = () => 'Total',
  hauteur = 180,
  legende = series.length > 1,
  activeInitiale = null,
  className,
}: ColonnesEmpileesProps) {
  const [active, setActive] = React.useState<number | null>(activeInitiale);
  const [isolee, setIsolee] = React.useState<string | null>(null);

  const totaux = periodes.map((p) =>
    series.reduce((s, x) => s + (p.valeurs[x.cle] ?? 0), 0),
  );
  const ticks =
    mode === 'pourcent'
      ? [0, 50, 100]
      : graduations(Math.max(0, ...totaux) / diviseur);
  const plafond = ticks[ticks.length - 1] || 1;
  const n = periodes.length;
  const libelleTick = (t: number) =>
    mode === 'pourcent' ? formatPourcent(t) : formatNombre(t);

  const hauteurSegment = (v: number, total: number) => {
    const rel =
      mode === 'pourcent' ? (total ? (v / total) * 100 : 0) : v / diviseur;
    return (rel / plafond) * hauteur;
  };

  const infobulle = (i: number) => {
    const p = periodes[i];
    return (
      <Infobulle
        titre={p.titreInfobulle}
        lignes={series.map((s) => ({
          cle: s.cle,
          libelle: s.libelle,
          couleur: s.couleur,
          valeur: formatValeur(p.valeurs[s.cle] ?? 0),
        }))}
        total={{
          libelle: libelleTotal(totaux[i], p),
          valeur: formatValeur(totaux[i]),
        }}
      />
    );
  };

  return (
    <div className={className}>
      {legende && (
        <Legende
          className="mb-4"
          entrees={series.map((s) => ({
            cle: s.cle,
            libelle: s.libelle,
            couleur: s.couleur,
          }))}
          isolee={isolee}
          onIsoler={setIsolee}
        />
      )}
      <div className="relative flex">
        {/* Axe Y */}
        <div
          className="relative w-10 shrink-0"
          style={{ height: hauteur }}
          aria-hidden="true"
        >
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-2 text-13 tabular-nums text-ink-3"
              style={{
                bottom: `${(t / plafond) * hauteur}px`,
                transform: 'translateY(50%)',
              }}
            >
              {libelleTick(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {/* Quadrillage et ligne de base */}
          <div
            className="absolute inset-x-0 top-0"
            style={{ height: hauteur }}
            aria-hidden="true"
          >
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute inset-x-0 h-px"
                style={{
                  bottom: `${(t / plafond) * hauteur}px`,
                  background: t === 0 ? 'var(--dv-base)' : 'var(--dv-grille)',
                }}
              />
            ))}
          </div>
          <div
            role="group"
            aria-label={resume}
            className="relative flex"
            style={{ height: hauteur }}
            onMouseLeave={() => setActive(activeInitiale)}
          >
            {periodes.map((p, i) => {
              const total = totaux[i];
              const visibles = series.filter(
                (s) => (p.valeurs[s.cle] ?? 0) > 0,
              );
              const montrerEtiquette =
                etiquettes === 'toutes' ||
                (etiquettes === 'derniere' && i === n - 1);
              return (
                <button
                  type="button"
                  key={p.cle}
                  aria-label={`${p.libelle}${p.sousLibelle ? ` ${p.sousLibelle}` : ''} : ${formatValeur(total)}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(activeInitiale)}
                  className={cn(
                    'relative flex h-full flex-1 cursor-default flex-col items-center justify-end outline-none',
                    active === i && 'bg-surface-2',
                    'focus-visible:ring-2 focus-visible:ring-primary',
                  )}
                >
                  {montrerEtiquette && total > 0 && (
                    <span className="mb-1 text-13 font-semibold leading-[18px] tabular-nums text-ink">
                      {formatValeur(total)}
                    </span>
                  )}
                  <span className="flex w-6 flex-col-reverse gap-0.5">
                    {visibles.map((s, k) => (
                      <span
                        key={s.cle}
                        data-serie={s.cle}
                        className={cn(
                          'block w-full transition-opacity',
                          k === visibles.length - 1 && 'rounded-t',
                          isolee && isolee !== s.cle && 'opacity-25',
                        )}
                        style={{
                          height: Math.max(
                            2,
                            hauteurSegment(p.valeurs[s.cle] ?? 0, total),
                          ),
                          background: s.couleur,
                        }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Axe X */}
          <div className="flex pt-1.5" aria-hidden="true">
            {periodes.map((p, i) => (
              <div
                key={p.cle}
                className={cn(
                  'flex-1 text-center text-13 leading-4 text-ink-3',
                  active === i && 'font-semibold text-ink',
                )}
              >
                <div>{p.libelle}</div>
                {p.sousLibelle && <div>{p.sousLibelle}</div>}
              </div>
            ))}
          </div>
          {active !== null && periodes[active] && (
            <div
              className="absolute top-0 z-10"
              style={
                active >= n / 2
                  ? { right: `calc(${((n - active - 0.5) / n) * 100}% + 24px)` }
                  : { left: `calc(${((active + 0.5) / n) * 100}% + 24px)` }
              }
            >
              {infobulle(active)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
