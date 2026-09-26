import { cn } from '@/utils/cn';

/** Étapes d'un formulaire (DS-Composants §05) : fait, en cours, à venir. */
export const Stepper = ({ steps, current, label }: { steps: string[]; current: number; label: string }) => (
  <ol aria-label={label} className="m-0 grid list-none gap-3 p-0" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
    {steps.map((step, index) => {
      const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
      const n = String(index + 1).padStart(2, '0');
      return (
        <li
          key={step}
          aria-current={state === 'current' ? 'step' : undefined}
          className={cn(
            'border-t-2 pt-2.5',
            state === 'done' && 'border-primary',
            state === 'current' && 'border-line-strong',
            state === 'upcoming' && 'border-line',
          )}
        >
          <span className={cn('tnum block text-meta', state === 'done' ? 'text-primary' : state === 'current' ? 'text-ink' : 'text-ink-3')}>
            {n} · {state === 'done' ? 'Fait' : state === 'current' ? 'En cours' : 'À venir'}
          </span>
          <span className={cn('mt-1 block hyphens-auto break-words text-base', state === 'current' ? 'font-semibold' : state === 'done' ? 'font-medium' : 'text-ink-3')}>
            {step}
          </span>
        </li>
      );
    })}
  </ol>
);
