import { cn } from '@/utils/cn';

import { formatPourcent, partPourcent } from '../../utils/format';

export interface SegmentFlux {
  cle: string;
  libelle: string;
  valeur: number;
  couleur: string;
}

interface BarreDeFluxProps {
  segments: SegmentFlux[];
  /** Résumé accessible (« Répartition par type de fonds »). */
  titre: string;
  hauteur?: number;
  className?: string;
}

/**
 * Barre de flux (spec 03 §5.2) : barre unique empilée à 100 %, segments dans
 * l'ordre fixe reçu, écart de 2 px, rayon 4 aux extrémités, pas d'étiquette
 * interne. Un segment non nul ne descend pas sous 2 px.
 */
export function BarreDeFlux({
  segments,
  titre,
  hauteur = 12,
  className,
}: BarreDeFluxProps) {
  const total = segments.reduce((s, x) => s + x.valeur, 0);
  const visibles = segments.filter((s) => s.valeur > 0);
  const resume = segments
    .map((s) => `${s.libelle} ${formatPourcent(partPourcent(s.valeur, total))}`)
    .join(', ');
  return (
    <div
      role="img"
      aria-label={`${titre} : ${resume}.`}
      className={cn('flex w-full gap-0.5', className)}
      style={{ height: hauteur }}
    >
      {visibles.map((s, i) => (
        <span
          key={s.cle}
          data-segment={s.cle}
          className={cn(
            'block h-full',
            i === 0 && 'rounded-l',
            i === visibles.length - 1 && 'rounded-r',
          )}
          style={{
            flexGrow: s.valeur,
            flexBasis: 0,
            minWidth: 2,
            background: s.couleur,
          }}
        />
      ))}
      {total === 0 && (
        <span
          className="block size-full rounded"
          style={{ background: 'var(--dv-piste)' }}
        />
      )}
    </div>
  );
}
