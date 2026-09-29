import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

export type WizardStepInfo = { title: string; summary?: string };

const STATE_LABEL = { done: 'Terminée', current: 'En cours', upcoming: '' } as const;

/**
 * Étapes de la demande (FID-Demande-Nouvelle) : quatre colonnes, pastille 28 et filet 2 px,
 * puis « Étape n · état », le titre et le résumé de ce qui a été choisi.
 */
export const WizardSteps = ({ steps, current }: { steps: WizardStepInfo[]; current: number }) => (
  <ol aria-label="Étapes de la demande" className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
    {steps.map((step, index) => {
      const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
      return (
        <li key={step.title} aria-current={state === 'current' ? 'step' : undefined} className="flex min-w-0 flex-col gap-3">
          <span className="flex items-center gap-3" aria-hidden="true">
            <span
              className={cn(
                'tnum inline-flex size-7 shrink-0 items-center justify-center rounded-full text-14 font-semibold',
                state === 'done' && 'bg-tint-100 text-tint-800',
                state === 'current' && 'border-2 border-primary bg-paper text-primary',
                state === 'upcoming' && 'border border-line-field bg-paper text-ink-3',
              )}
            >
              {state === 'done' ? <Icon name="check" size={16} strokeWidth={2.25} /> : index + 1}
            </span>
            {index < steps.length - 1 && (
              <span className={cn('hidden h-0.5 flex-1 rounded-full md:block', state === 'done' ? 'bg-primary-fill' : 'bg-line')} />
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className={cn('text-13', state === 'current' ? 'font-medium text-primary' : 'text-ink-3')}>
              Étape {index + 1}
              {STATE_LABEL[state] && ` · ${STATE_LABEL[state]}`}
            </span>
            <span className={cn('text-15 font-semibold', state === 'upcoming' ? 'text-ink-2' : 'text-ink')}>{step.title}</span>
            {step.summary && <span className={cn('truncate text-14', state === 'upcoming' ? 'text-ink-3' : 'text-ink-2')}>{step.summary}</span>}
          </span>
        </li>
      );
    })}
  </ol>
);
