import { Icon } from '@/components/ui/icon';
import { mysteryTitle } from '@/features/chapelet/utils/rosary';
import type { Mystery } from '@/hooks/use-rosary-today';
import { cn } from '@/utils/cn';

/** « Les cinq mystères » (FID-Chapelet) : priés, en cours, à venir ; chacun permet d'y aller directement. */
export const MysteryList = ({
  group,
  mysteries,
  current,
  done,
  onJump,
}: {
  group: string;
  mysteries: Mystery[];
  current: number;
  done: boolean;
  onJump: (index: number) => void;
}) => (
  <section aria-labelledby="chapelet-mysteres">
    <h2 id="chapelet-mysteres" className="m-0 text-18 font-semibold text-ink">
      Les cinq mystères {group}
    </h2>
    <ol className="m-0 mt-3 list-none overflow-hidden rounded-16 border border-line bg-paper p-0 text-15">
      {mysteries.map((m, i) => {
        const prayed = done || i < current;
        const active = !done && i === current;
        return (
          <li key={m.id} aria-current={active ? 'step' : undefined} className="border-b border-line last:border-b-0">
            <button
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                'flex min-h-13 w-full gap-3 px-4 py-3.5 text-left transition-colors',
                active ? 'items-start bg-tint-50 text-ink' : 'items-center text-ink-2 hover:bg-surface',
              )}
            >
              {prayed ? (
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-fill text-on-primary">
                  <Icon name="check" size={14} strokeWidth={2.5} />
                </span>
              ) : active ? (
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary-fill bg-paper">
                  <span className="size-2.5 rounded-full bg-primary-fill" />
                </span>
              ) : (
                <span className="tnum inline-flex size-6 shrink-0 items-center justify-center rounded-full border-1.5 border-line-field text-12 font-semibold text-ink-3">
                  {i + 1}
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className={cn(active && 'font-semibold')}>
                  {mysteryTitle(m)}
                  {prayed && <span className="sr-only">, prié</span>}
                </span>
                {active && <span className="text-13 text-tint-800">En cours · dizaine {i + 1}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </section>
);
