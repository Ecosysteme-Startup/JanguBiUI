'use client';

import * as React from 'react';

import { NBSP } from '../../utils/format';

import { useLargeur } from './use-largeur';

export interface LigneThermique {
  cle: string;
  libelle: string;
  /** Libellé long pour l'infobulle native (« mardi 22 »). */
  libelleLong: string;
  /** Jusqu'à 24 valeurs ; les heures manquantes sont « à venir ». */
  heures: number[];
  enGras?: boolean;
}

/** Classes fixes (spec 03 §5.10), 0 = surface2. */
export const CLASSES_THERMIQUES = [
  { min: 0, max: 0, libelle: '0', couleur: 'var(--dv-seq-0)' },
  { min: 1, max: 1, libelle: '1', couleur: 'var(--dv-seq-1)' },
  { min: 2, max: 3, libelle: '2-3', couleur: 'var(--dv-seq-2)' },
  { min: 4, max: 6, libelle: '4-6', couleur: 'var(--dv-seq-3)' },
  { min: 7, max: Infinity, libelle: '7 et plus', couleur: 'var(--dv-seq-4)' },
] as const;

export const classeThermique = (v: number) =>
  CLASSES_THERMIQUES.find((c) => v >= c.min && v <= c.max) ??
  CLASSES_THERMIQUES[0];

interface CarteThermiqueProps {
  lignes: LigneThermique[];
  resume: string;
  unite: string;
  className?: string;
}

const GAUCHE = 64;
const HAUT = 20;
const H_CELLULE = 20;
const ECART = 2;

/** Carte thermique 7 × 24 (web plateforme), cellules `<rect fill>`. */
export function CarteThermique({
  lignes,
  resume,
  unite,
  className,
}: CarteThermiqueProps) {
  const [ref, largeur] = useLargeur<HTMLDivElement>(900);
  const lCellule = Math.max(8, (largeur - GAUCHE) / 24 - ECART);
  const hauteur = HAUT + lignes.length * (H_CELLULE + ECART);
  return (
    <div className={className}>
      <div ref={ref}>
        <svg
          width={largeur}
          height={hauteur}
          viewBox={`0 0 ${largeur} ${hauteur}`}
          role="img"
          aria-label={resume}
          className="block"
        >
          {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
            <text
              key={h}
              x={GAUCHE + h * (lCellule + ECART)}
              y={12}
              className="fill-ink-3 text-13"
            >
              {`${h}${NBSP}h`}
            </text>
          ))}
          {lignes.map((l, r) => {
            const y = HAUT + r * (H_CELLULE + ECART);
            return (
              <g key={l.cle}>
                <text
                  x={0}
                  y={y + H_CELLULE / 2}
                  dominantBaseline="middle"
                  className={
                    l.enGras
                      ? 'fill-ink text-13 font-semibold'
                      : 'fill-ink-3 text-13'
                  }
                >
                  {l.libelle}
                </text>
                {l.heures.map((v, h) => (
                  <rect
                    key={h}
                    x={GAUCHE + h * (lCellule + ECART)}
                    y={y}
                    width={lCellule}
                    height={H_CELLULE}
                    rx={2}
                    style={{ fill: classeThermique(v).couleur }}
                  >
                    <title>{`${l.libelleLong}, ${h}${NBSP}h : ${v}`}</title>
                  </rect>
                ))}
                {l.heures.length < 24 && (
                  <text
                    x={GAUCHE + l.heures.length * (lCellule + ECART) + 6}
                    y={y + H_CELLULE / 2}
                    dominantBaseline="middle"
                    className="fill-ink-3 text-13"
                  >
                    à venir
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div
        className="mt-4 flex flex-wrap items-center gap-3.5 text-13 leading-[18px] text-ink-2 tabular-nums"
        style={{ marginLeft: GAUCHE }}
      >
        <span className="text-ink-3">moins</span>
        {CLASSES_THERMIQUES.map((c) => (
          <span key={c.libelle} className="inline-flex items-center gap-1.5">
            <svg width="16" height="10" aria-hidden="true">
              <rect width="16" height="10" rx="2" style={{ fill: c.couleur }} />
            </svg>
            {c.libelle}
          </span>
        ))}
        <span className="text-ink-3">plus · {unite}</span>
      </div>
    </div>
  );
}
