import type { Bead } from '@/features/chapelet/utils/rosary';
import { cn } from '@/utils/cn';

/** La dizaine en grains : NP, 1…10, G ; le grain en cours est marqué `aria-current="step"`. */
export const DecadeBeads = ({ beads, step }: { beads: Bead[]; step: number }) => {
  const current = beads[step];
  const total = beads.filter((b) => b.hailMary !== null).length;
  const label = current?.hailMary
    ? `Progression de la dizaine : ${current.hailMary}e Je vous salue Marie sur ${total}`
    : `Progression de la dizaine : grain ${step + 1} sur ${beads.length}`;
  return (
    <ol aria-label={label} className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
      {beads.map((bead, i) => {
        const state = i < step ? 'dit' : i === step ? 'courant' : 'avenir';
        return (
          <li
            key={i}
            aria-current={state === 'courant' ? 'step' : undefined}
            className={cn(
              'tnum inline-flex items-center justify-center rounded-full border text-meta',
              bead.hailMary === null ? 'size-9' : 'size-7',
              state === 'dit' && 'border-primary bg-primary text-on-primary',
              state === 'courant' && 'border-ink bg-ink text-paper ring-2 ring-primary ring-offset-2 ring-offset-paper',
              state === 'avenir' && 'border-line-field text-ink-3',
            )}
          >
            {bead.label}
          </li>
        );
      })}
    </ol>
  );
};
