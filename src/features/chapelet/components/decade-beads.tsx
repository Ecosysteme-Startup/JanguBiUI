import { Icon } from '@/components/ui/icon';
import type { Bead } from '@/features/chapelet/utils/rosary';
import { cn } from '@/utils/cn';

/**
 * La dizaine en grains (FID-Chapelet) : Notre Père et Gloire en carrés, Ave en ronds ; dits en aplat,
 * le grain en cours agrandi et cerclé (`aria-current="step"`), les suivants au trait.
 */
export const DecadeBeads = ({ beads, step }: { beads: Bead[]; step: number }) => {
  const current = beads[step];
  const total = beads.filter((b) => b.hailMary !== null).length;
  const label = current?.hailMary
    ? `Progression de la dizaine : ${current.hailMary}e Je vous salue Marie sur ${total}`
    : `Progression de la dizaine : ${current?.prayer.type_display ?? 'grain'} (${step + 1} sur ${beads.length})`;
  const first = beads[0];
  const last = beads.at(-1);

  return (
    <div className="mt-7">
      <ol aria-label={label} className="m-0 flex list-none flex-wrap items-center justify-between gap-x-0.5 gap-y-2 p-0 sm:gap-x-1">
        {beads.map((bead, i) => {
          const state = i < step ? 'dit' : i === step ? 'courant' : 'avenir';
          const square = bead.hailMary === null;
          return (
            <li
              key={i}
              aria-current={state === 'courant' ? 'step' : undefined}
              className={cn(
                'inline-flex shrink-0 items-center justify-center',
                state === 'courant'
                  ? cn('size-6 border-3 sm:size-8 border-primary-fill bg-tint-100 ring-4 ring-tint-50', square ? 'rounded-8' : 'rounded-full')
                  : square
                    ? 'size-6 rounded-8 sm:size-7'
                    : 'size-4 rounded-full sm:size-5',
                state === 'dit' && 'bg-primary-fill text-on-primary',
                state === 'avenir' && 'border-1.5 border-line-field',
              )}
            >
              {state === 'dit' && square && <Icon name="check" size={16} strokeWidth={2.25} />}
              <span className="sr-only">{bead.prayer.type_display}{bead.hailMary !== null && ` ${bead.hailMary}`}</span>
            </li>
          );
        })}
      </ol>
      <p aria-hidden="true" className="m-0 mt-2.5 flex justify-between gap-2 text-13 text-ink-3">
        <span className="hidden sm:inline">{first?.prayer.type_display}</span>
        <span className="tnum font-semibold text-ink">
          {current?.prayer.type_display}
          {current?.hailMary !== null && current && ` · ${current.hailMary} sur ${total}`}
        </span>
        <span className="hidden sm:inline">{last?.prayer.type_display}</span>
      </p>
    </div>
  );
};
