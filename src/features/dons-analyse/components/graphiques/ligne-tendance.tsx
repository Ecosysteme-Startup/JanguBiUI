'use client';

import * as React from 'react';

import { formatNombre } from '../../utils/format';

import { graduations } from './echelle';
import { Infobulle } from './infobulle';
import { Legende } from './legende';
import { useLargeur } from './use-largeur';

export interface SerieLigne {
  cle: string;
  libelle: string;
  /** Couleur de trait (variable CSS). */
  couleur: string;
  /** Une valeur par position de l'axe X ; `null` = pas de donnée (futur). */
  valeurs: (number | null)[];
  /** Série de comparaison (trait plein gris, étiquette en ink3). */
  comparaison?: boolean;
  /** Aplat à 10 % sous la ligne. */
  aire?: boolean;
  /** Étiquette de fin, une ou deux lignes. */
  etiquetteFin?: string[];
}

interface LigneTendanceProps {
  x: string[];
  /** En-tête d'infobulle par position (« mardi 22 sept. »). */
  titresX?: string[];
  titreAxeX?: string;
  series: SerieLigne[];
  objectif?: { valeur: number; libelle: string };
  diviseur?: number;
  formatValeur?: (n: number) => string;
  resume: string;
  hauteur?: number;
  legende?: boolean;
  margeDroite?: number;
  className?: string;
}

const HAUT = 16;
const GAUCHE = 44;

/**
 * Ligne de tendance (spec 03 §5.4) : trait 2 px, point final cerclé de la
 * couleur de surface, étiquettes en bout ; objectif en filet plein ; réticule
 * au survol qui liste toutes les séries à la date la plus proche.
 */
export function LigneTendance({
  x,
  titresX,
  titreAxeX,
  series,
  objectif,
  diviseur = 1,
  formatValeur = formatNombre,
  resume,
  hauteur = 200,
  legende = series.length > 1,
  margeDroite = 112,
  className,
}: LigneTendanceProps) {
  const [ref, largeur] = useLargeur<HTMLDivElement>();
  const [active, setActive] = React.useState<number | null>(null);
  const bas = titreAxeX ? 40 : 26;
  const valeursMax = Math.max(
    0,
    objectif ? objectif.valeur : 0,
    ...series.flatMap((s) => s.valeurs.filter((v): v is number => v !== null)),
  );
  const ticks = graduations(valeursMax / diviseur, 4);
  const plafond = ticks[ticks.length - 1] || 1;
  const trace = { l: GAUCHE, r: Math.max(GAUCHE + 40, largeur - margeDroite) };
  const hTrace = hauteur - HAUT - bas;
  const px = (i: number) =>
    x.length <= 1
      ? trace.l
      : trace.l + (i / (x.length - 1)) * (trace.r - trace.l);
  const py = (v: number) => HAUT + hTrace - (v / diviseur / plafond) * hTrace;

  const chemin = (s: SerieLigne) =>
    s.valeurs
      .map((v, i) =>
        v === null ? null : `${px(i).toFixed(1)},${py(v).toFixed(1)}`,
      )
      .filter(Boolean)
      .join(' ');

  const dernier = (s: SerieLigne) => {
    for (let i = s.valeurs.length - 1; i >= 0; i -= 1) {
      if (s.valeurs[i] !== null) return i;
    }
    return -1;
  };

  const surMouvement = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left;
    const i = Math.round((rel / rect.width) * (x.length - 1));
    const borne = Math.max(0, Math.min(x.length - 1, i));
    const aDonnee = series.some((s) => s.valeurs[borne] !== null);
    setActive(aDonnee ? borne : null);
  };

  return (
    <div className={className}>
      {legende && (
        <Legende
          className="mb-3"
          entrees={series.map((s) => ({
            cle: s.cle,
            libelle: s.libelle,
            couleur: s.couleur,
            forme: 'trait',
          }))}
        />
      )}
      <div ref={ref} className="relative">
        <svg
          width={largeur}
          height={hauteur}
          viewBox={`0 0 ${largeur} ${hauteur}`}
          role="img"
          aria-label={resume}
          className="block overflow-visible"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={trace.l}
                x2={trace.r}
                y1={py(t * diviseur)}
                y2={py(t * diviseur)}
                style={{
                  stroke: t === 0 ? 'var(--dv-base)' : 'var(--dv-grille)',
                }}
                strokeWidth={1}
              />
              <text
                x={trace.l - 8}
                y={py(t * diviseur)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs tabular-nums"
              >
                {formatNombre(t)}
              </text>
            </g>
          ))}
          {x.map((l, i) => (
            <text
              key={`${l}-${i}`}
              x={px(i)}
              y={HAUT + hTrace + 16}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {l}
            </text>
          ))}
          {titreAxeX && (
            <text
              x={(trace.l + trace.r) / 2}
              y={HAUT + hTrace + 32}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {titreAxeX}
            </text>
          )}
          {objectif && (
            <g>
              <line
                x1={trace.l}
                x2={trace.r}
                y1={py(objectif.valeur)}
                y2={py(objectif.valeur)}
                className="stroke-muted-foreground"
                strokeWidth={1}
              />
              <text
                x={trace.r}
                y={py(objectif.valeur) - 6}
                textAnchor="end"
                className="fill-muted-foreground text-xs tabular-nums"
              >
                {objectif.libelle}
              </text>
            </g>
          )}
          {series.map((s) => {
            const pts = chemin(s);
            const fin = dernier(s);
            if (fin < 0) return null;
            const premier = s.valeurs.findIndex((v) => v !== null);
            return (
              <g key={s.cle} data-serie={s.cle}>
                {s.aire && (
                  <polygon
                    points={`${px(premier)},${py(0)} ${pts} ${px(fin)},${py(0)}`}
                    style={{ fill: s.couleur, fillOpacity: 0.1 }}
                  />
                )}
                <polyline
                  points={pts}
                  fill="none"
                  style={{ stroke: s.couleur }}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {!s.comparaison && (
                  <circle
                    cx={px(fin)}
                    cy={py(s.valeurs[fin] as number)}
                    r={4}
                    style={{ fill: s.couleur, stroke: 'hsl(var(--card))' }}
                    strokeWidth={2}
                  />
                )}
                {s.etiquetteFin?.map((ligne, k) => (
                  <text
                    key={ligne}
                    x={px(fin) + 10}
                    y={
                      py(s.valeurs[fin] as number) +
                      (k - (s.etiquetteFin!.length - 1) / 2) * 16
                    }
                    dominantBaseline="middle"
                    className={
                      k === s.etiquetteFin!.length - 1
                        ? 'fill-foreground text-[13px] font-semibold tabular-nums'
                        : 'fill-foreground/80 text-xs'
                    }
                  >
                    {ligne}
                  </text>
                ))}
              </g>
            );
          })}
          {active !== null && (
            <line
              x1={px(active)}
              x2={px(active)}
              y1={HAUT}
              y2={HAUT + hTrace}
              style={{ stroke: 'var(--dv-base)' }}
              strokeWidth={1}
            />
          )}
          <rect
            x={trace.l}
            y={HAUT}
            width={trace.r - trace.l}
            height={hTrace}
            fill="transparent"
            onMouseMove={surMouvement}
            onMouseLeave={() => setActive(null)}
          />
        </svg>
        {active !== null && (
          <div
            className="absolute z-10"
            style={
              px(active) > largeur / 2
                ? { right: largeur - px(active) + 12, top: HAUT }
                : { left: px(active) + 12, top: HAUT }
            }
          >
            <Infobulle
              titre={titresX?.[active] ?? x[active]}
              lignes={series
                .filter((s) => s.valeurs[active] !== null)
                .map((s) => ({
                  cle: s.cle,
                  libelle: s.libelle,
                  couleur: s.couleur,
                  valeur: formatValeur(s.valeurs[active] as number),
                }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
