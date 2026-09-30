import { cn } from '@/utils/cn';

import { progressPercent } from '../../utils/format';

/**
 * Barre d'avancement d'une campagne (h 6, rayon 3, piste surface-2, remplissage primary-fill).
 * Jamais de jauge-thermomètre : le chiffre est écrit à côté par l'appelant.
 */
export const FundProgress = ({
  raised,
  goal,
  className,
}: {
  raised: number;
  goal: number | null | undefined;
  className?: string;
}) => {
  const percent = progressPercent(raised, goal);
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Avancement de la collecte"
      className={cn(
        'h-1.5 overflow-hidden rounded-[3px] bg-surface-2',
        className,
      )}
    >
      <div
        className="h-1.5 origin-left animate-jb-grow rounded-[3px] bg-primary-fill"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};
