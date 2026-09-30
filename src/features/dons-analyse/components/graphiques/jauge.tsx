import { cn } from '@/utils/cn';

interface JaugeProps {
  /** Part en pourcentage ; peut dépasser 100 (la barre reste pleine). */
  pourcent: number;
  /** Libellé écrit (« 86 % reversé »). */
  libelle: string;
  /** Nom accessible de la mesure. */
  titre: string;
  position?: 'droite' | 'dessous';
  className?: string;
}

/** Jauge DS (h 6, rayon 3, piste surface2, remplissage b600), sans seuil coloré. */
export function Jauge({
  pourcent,
  libelle,
  titre,
  position = 'dessous',
  className,
}: JaugeProps) {
  const largeur = Math.max(0, Math.min(100, pourcent));
  return (
    <div
      className={cn(
        position === 'droite'
          ? 'flex items-center gap-3'
          : 'flex flex-col gap-1',
        className,
      )}
    >
      <div
        role="meter"
        aria-label={titre}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pourcent)}
        aria-valuetext={libelle}
        className={cn(
          'h-1.5 w-full shrink-0 overflow-hidden rounded-[3px]',
          position === 'droite' && 'flex-1 shrink',
        )}
        style={{ background: 'var(--dv-piste)' }}
      >
        <div
          className="h-full origin-left animate-jb-grow rounded-[3px]"
          style={{ width: `${largeur}%`, background: 'var(--dv-colonne)' }}
        />
      </div>
      <span className="whitespace-nowrap text-13 leading-[18px] text-ink-3 tabular-nums">
        {libelle}
      </span>
    </div>
  );
}
