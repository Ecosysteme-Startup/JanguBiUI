import * as React from 'react';

import { cn } from '@/utils/cn';

interface ChiffreTitreProps {
  /** Libellé au-dessus (« Collecté en septembre »). */
  libelle?: React.ReactNode;
  /** Horodatage à droite du libellé (« au 28 sept., 9:15 »). */
  horodatage?: React.ReactNode;
  /** Badge ou élément à droite de la ligne de libellé. */
  badge?: React.ReactNode;
  /** Texte avant le chiffre (« Environ », « Sur septembre, »). */
  avant?: React.ReactNode;
  /** Le chiffre-titre, déjà formaté. */
  valeur: string;
  /** Unité après une espace insécable (« FCFA »). */
  unite?: string;
  /** Suite de la phrase de synthèse. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Chiffre-titre sobre (spec 03 §5.1) : un seul par écran, intégré à une phrase
 * de synthèse. 32 px, chiffres proportionnels, sans delta coloré ni icône.
 */
export function ChiffreTitre({
  libelle,
  horodatage,
  badge,
  avant,
  valeur,
  unite,
  children,
  className,
}: ChiffreTitreProps) {
  return (
    <div className={className}>
      {(libelle || badge) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-14 font-medium text-ink-3">
            {libelle}
            {horodatage && (
              <span className="text-13 font-normal tabular-nums">
                {' · '}
                {horodatage}
              </span>
            )}
          </p>
          {badge}
        </div>
      )}
      <p className={cn('text-15 leading-7 text-ink-2', libelle && 'mt-2')}>
        {avant && <>{avant} </>}
        <span
          data-chiffre-titre
          className="text-32 font-semibold leading-10 text-ink [font-variant-numeric:normal]"
        >
          {valeur}
        </span>
        {unite && (
          <span className="text-20 font-medium text-ink-2">
            {'\u00A0'}
            {unite}
          </span>
        )}
        {children && <> {children}</>}
      </p>
    </div>
  );
}
