import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

const STATE_LABEL = { done: 'terminée', current: 'en cours', upcoming: 'à venir' } as const;

/**
 * Étapes d'un formulaire (WEB-Design-System, « Étapes ») : pastilles 28 px reliées par un filet de
 * 2 px ; faite = aplat b600 et coche, en cours = anneau b600 et libellé 600, à venir = anneau
 * lineField. Libellés 14/500, coupés dans leur colonne plutôt que de déborder (A11Y-15) ; l'état
 * est donné en toutes lettres au lecteur d'écran.
 */
export const Stepper = ({ steps, current, label }: { steps: string[]; current: number; label: string }) => (
  <ol aria-label={label} className="m-0 flex list-none flex-wrap items-center gap-3 p-0">
    {steps.map((step, index) => {
      const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
      return (
        <li
          key={step}
          aria-current={state === 'current' ? 'step' : undefined}
          className={cn(
            'flex min-w-0 items-center gap-3 text-14',
            index > 0 && 'flex-1',
            state === 'current' ? 'font-semibold text-ink' : 'font-medium text-ink-2',
          )}
        >
          {index > 0 && (
            <span aria-hidden="true" className={cn('h-0.5 min-w-4 flex-1 rounded-full', index <= current ? 'bg-primary-fill' : 'bg-line')} />
          )}
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'tnum inline-flex size-7 shrink-0 items-center justify-center rounded-full text-14',
                state === 'done' && 'bg-primary-fill text-on-primary',
                state === 'current' && 'border-2 border-primary font-semibold text-primary',
                state === 'upcoming' && 'border-1.5 border-line-field text-ink-2',
              )}
            >
              {state === 'done' ? <Icon name="check" size={15} strokeWidth={2.5} /> : index + 1}
            </span>
            <span className="min-w-0 hyphens-auto break-words">{step}</span>
            <span className="sr-only"> ({STATE_LABEL[state]})</span>
          </span>
        </li>
      );
    })}
  </ol>
);
