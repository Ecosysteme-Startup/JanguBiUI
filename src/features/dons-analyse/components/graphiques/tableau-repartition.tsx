import * as React from 'react';

import { cn } from '@/utils/cn';

import { formatNombre, formatPourcent, partPourcent } from '../../utils/format';

import { Pastille } from './legende';

export interface LigneTableauRepartition {
  cle: string;
  libelle: string;
  /** Complément en ink3 après le libellé (« 29 dons »). */
  complement?: string | null;
  valeur: number;
  /** 1 = sous-ligne (retrait 16 px, libellé atténué). */
  niveau?: number;
  /** Ligne « non renseigné » : barre grise, libellé atténué. */
  nonRenseigne?: boolean;
  /** Pastille de série (tableaux par fonds) ; remplace la barre. */
  couleur?: string;
  /** Ligne mise en gras (ligne parente). */
  forte?: boolean;
}

interface TableauRepartitionProps {
  /** Légende du tableau (titre + période + unité), lue par les lecteurs d'écran. */
  caption: string;
  entete: { libelle: string; valeur: string };
  lignes: LigneTableauRepartition[];
  /** Total (par défaut : somme des lignes de niveau 0). */
  total?: number;
  /** Montre la colonne « Répartition » (barres b400 de 6 px, une seule couleur). */
  barres?: boolean;
  formatValeur?: (n: number) => string;
  className?: string;
}

/**
 * Tableau de répartition (spec 03 §5.5) : ordre canonique reçu, jamais trié
 * par montant ; barres d'une seule couleur proportionnelles au maximum du
 * tableau ; valeurs et parts toujours écrites.
 */
export function TableauRepartition({
  caption,
  entete,
  lignes,
  total: totalFourni,
  barres = true,
  formatValeur = formatNombre,
  className,
}: TableauRepartitionProps) {
  const total =
    totalFourni ??
    lignes.filter((l) => !l.niveau).reduce((s, l) => s + l.valeur, 0);
  const max = Math.max(1, ...lignes.map((l) => l.valeur));
  return (
    <table
      className={cn('w-full table-fixed border-collapse text-14', className)}
    >
      <caption className="sr-only">{caption}</caption>
      <colgroup>
        <col />
        {barres && <col className="w-[120px]" />}
        <col className="w-[120px]" />
        <col className="w-[52px]" />
      </colgroup>
      <thead>
        <tr className="text-left text-13 font-medium text-ink-3">
          <th scope="col" className="pb-1 font-medium">
            {entete.libelle}
          </th>
          {barres && (
            <th scope="col" className="pb-1 font-medium">
              Répartition
            </th>
          )}
          <th scope="col" className="pb-1 text-right font-medium">
            {entete.valeur}
          </th>
          <th scope="col" className="pb-1 text-right font-medium">
            Part
          </th>
        </tr>
      </thead>
      <tbody>
        {lignes.map((l) => (
          <tr key={l.cle} className="h-11 border-t border-line">
            <th
              scope="row"
              className={cn(
                'truncate text-left font-normal',
                l.niveau ? 'pl-4 text-ink-2' : 'text-ink',
                l.forte && 'font-semibold',
                l.nonRenseigne && 'text-ink-3',
              )}
            >
              <span className="inline-flex max-w-full items-center gap-2">
                {l.couleur && <Pastille couleur={l.couleur} />}
                <span className="truncate">
                  {l.libelle}
                  {l.complement && (
                    <span className="text-13 font-normal text-ink-3">
                      {' · '}
                      {l.complement}
                    </span>
                  )}
                </span>
              </span>
            </th>
            {barres && (
              <td className="pr-3">
                {l.valeur > 0 && (
                  <span
                    data-barre
                    className="block h-1.5 rounded-r"
                    style={{
                      width: `${Math.max(2, (l.valeur / max) * 100)}%`,
                      background: l.nonRenseigne
                        ? 'var(--dv-base)'
                        : 'var(--dv-barre)',
                    }}
                  />
                )}
              </td>
            )}
            <td className="text-right font-semibold tabular-nums text-ink">
              {formatValeur(l.valeur)}
            </td>
            <td className="text-right text-13 tabular-nums text-ink-3">
              {formatPourcent(partPourcent(l.valeur, total))}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="h-11 border-t border-[color:var(--dv-base)]">
          <th scope="row" className="text-left font-semibold">
            Total
          </th>
          {barres && <td />}
          <td className="text-right font-semibold tabular-nums">
            {formatValeur(total)}
          </td>
          <td className="text-right text-13 tabular-nums text-ink-3">
            {formatPourcent(total > 0 ? 100 : 0)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

interface TableauSimpleProps {
  caption: string;
  colonnes: { libelle: string; alignement?: 'gauche' | 'droite' }[];
  lignes: { cle: string; cellules: React.ReactNode[] }[];
  pied?: React.ReactNode[];
  className?: string;
}

/** Vue tableau générique des figures (spec 03 §3.9). */
export function TableauSimple({
  caption,
  colonnes,
  lignes,
  pied,
  className,
}: TableauSimpleProps) {
  const align = (i: number) =>
    colonnes[i]?.alignement === 'droite'
      ? 'text-right tabular-nums'
      : 'text-left';
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-14">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-13 text-ink-3">
            {colonnes.map((c, i) => (
              <th
                key={c.libelle}
                scope="col"
                className={cn('pb-1 pr-2 font-medium', align(i))}
              >
                {c.libelle}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.cle} className="h-11 border-t border-line">
              {l.cellules.map((c, i) =>
                i === 0 ? (
                  <th
                    key={i}
                    scope="row"
                    className="pr-2 text-left font-normal text-ink"
                  >
                    {c}
                  </th>
                ) : (
                  <td key={i} className={cn('pr-2 text-ink', align(i))}>
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
        {pied && (
          <tfoot>
            <tr className="h-11 border-t border-[color:var(--dv-base)] font-semibold">
              {pied.map((c, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="pr-2 text-left">
                    {c}
                  </th>
                ) : (
                  <td key={i} className={cn('pr-2', align(i))}>
                    {c}
                  </td>
                ),
              )}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
