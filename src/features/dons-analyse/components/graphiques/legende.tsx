import { cn } from '@/utils/cn';

export interface EntreeLegende {
  cle: string;
  libelle: string;
  couleur: string;
  forme?: 'carre' | 'trait';
}

export function Pastille({
  couleur,
  forme = 'carre',
  className,
}: {
  couleur: string;
  forme?: 'carre' | 'trait';
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block shrink-0',
        forme === 'carre'
          ? 'size-2.5 rounded-[3px]'
          : 'h-0.5 w-3 rounded-[1px]',
        className,
      )}
      style={{ background: couleur }}
    />
  );
}

interface LegendeProps {
  entrees: EntreeLegende[];
  /** Série isolée (les autres passent à 25 % d'opacité, sans changer de couleur). */
  isolee?: string | null;
  onIsoler?: (cle: string | null) => void;
  className?: string;
}

/** Légende (spec 03 §5.6) : pastille + libellé ; clic = isoler la série. */
export function Legende({
  entrees,
  isolee,
  onIsoler,
  className,
}: LegendeProps) {
  return (
    <ul
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}
    >
      {entrees.map((e) => {
        const contenu = (
          <>
            <Pastille couleur={e.couleur} forme={e.forme} />
            <span>{e.libelle}</span>
          </>
        );
        return (
          <li
            key={e.cle}
            className={cn(
              'text-[13px] leading-[18px] text-foreground/80',
              isolee && isolee !== e.cle && 'opacity-50',
            )}
          >
            {onIsoler ? (
              <button
                type="button"
                aria-pressed={isolee === e.cle}
                onClick={() => onIsoler(isolee === e.cle ? null : e.cle)}
                className="inline-flex items-center gap-1.5 rounded-md hover:text-foreground"
              >
                {contenu}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                {contenu}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
