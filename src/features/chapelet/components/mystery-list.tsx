import type { Mystery } from '@/features/chapelet/api/get-rosary-today';
import { fruitLabel, mysteryTitle } from '@/features/chapelet/utils/rosary';
import { cn } from '@/utils/cn';

/** Les cinq mystères : priés, en cours, à venir ; chacun permet d'y aller directement. */
export const MysteryList = ({
  mysteries,
  current,
  done,
  onJump,
}: {
  mysteries: Mystery[];
  current: number;
  done: boolean;
  onJump: (index: number) => void;
}) => (
  <section aria-labelledby="chapelet-mysteres">
    <h2 id="chapelet-mysteres" className="tnum m-0 border-t border-line-strong pt-3 text-meta font-normal text-ink-2">
      Les cinq mystères
    </h2>
    <ol className="m-0 mt-2 list-none p-0">
      {mysteries.map((m, i) => {
        const prayed = done || i < current;
        const active = !done && i === current;
        return (
          <li key={m.id} aria-current={active ? 'step' : undefined}>
            <button
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                'flex w-full items-start gap-3 border-b border-line py-3 text-left transition-colors hover:bg-surface-2',
                active && 'bg-tint-50',
              )}
            >
              <span
                className={cn(
                  'tnum inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-meta',
                  prayed ? 'border-primary-fill bg-primary-fill text-on-primary' : active ? 'border-ink text-ink' : 'border-line-field text-ink-3',
                )}
              >
                {i + 1}
              </span>
              <span className="flex-1">
                <span className={cn('block text-base', active ? 'font-semibold text-ink' : 'text-ink')}>{mysteryTitle(m)}</span>
                <span className="tnum mt-0.5 block text-meta text-ink-3">
                  {[m.meditation_source, fruitLabel(m), prayed ? 'priée' : active ? 'en cours' : null].filter(Boolean).join(' · ')}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </section>
);
