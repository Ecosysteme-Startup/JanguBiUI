import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import type { TrackingStep } from '../utils/timeline';

/**
 * Historique d'une demande (FID-Demande-Suivi) : date et heure à gauche, pastille et filet
 * (plein jusqu'à l'étape actuelle, pointillé ensuite), titre 15 et détail 14.
 */
export const TrackingHistory = ({ steps }: { steps: TrackingStep[] }) => (
  <ol aria-label="Avancement de la demande" className="m-0 list-none rounded-16 border border-line bg-paper p-5 shadow-card sm:p-6">
    {steps.map((step, index) => {
      const last = index === steps.length - 1;
      const next = steps[index + 1];
      const solid = step.state === 'done' && next?.state !== 'upcoming';
      return (
        <li
          key={step.key}
          aria-current={step.state === 'current' ? 'step' : undefined}
          className="grid grid-cols-[56px_20px_minmax(0,1fr)] gap-3 sm:grid-cols-[72px_20px_minmax(0,1fr)] sm:gap-4"
        >
          <span className="tnum flex flex-col text-right">
            {step.at ? (
              <>
                <span className={cn('text-14 font-semibold', step.state === 'current' ? 'text-primary' : 'text-ink')}>
                  {dayjs(step.at).format('D MMM')}
                </span>
                <span className="text-13 text-ink-3">{dayjs(step.at).format('H:mm')}</span>
              </>
            ) : (
              <span className="text-13 leading-5 text-ink-3">{step.when}</span>
            )}
          </span>
          <span aria-hidden="true" className="flex flex-col items-center">
            {step.state === 'done' && <span className="mt-[5px] size-2.5 rounded-full bg-primary-fill" />}
            {step.state === 'current' && <span className="mt-0.5 size-4 rounded-full border-4 border-primary-fill bg-paper" />}
            {step.state === 'upcoming' && <span className="mt-[5px] size-2.5 rounded-full border-1.5 border-line-field bg-paper" />}
            {!last && (solid ? <span className="mt-1 w-0.5 flex-1 bg-primary-fill" /> : <span className="mt-1 w-0 flex-1 border-l-2 border-dashed border-tint-300" />)}
          </span>
          <span className={cn('flex flex-col', !last && 'pb-5')}>
            <span
              className={cn(
                'text-15 leading-5',
                step.state === 'upcoming' ? 'font-medium text-ink-2' : 'font-semibold',
                step.state === 'current' ? 'text-primary' : step.state === 'done' && 'text-ink',
              )}
            >
              <span>{step.title}</span>
              {step.state === 'current' && <span className="font-normal text-ink-3"> · étape actuelle</span>}
            </span>
            {step.detail && <span className={cn('text-14', step.state === 'upcoming' ? 'text-ink-3' : 'text-ink-2')}>{step.detail}</span>}
          </span>
        </li>
      );
    })}
  </ol>
);
