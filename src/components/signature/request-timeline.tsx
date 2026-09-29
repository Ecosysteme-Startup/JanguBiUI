import { cn } from '@/utils/cn';

export type TimelineStep = {
  key: string;
  when: string;
  title: string;
  detail?: string;
  state: 'done' | 'current' | 'upcoming';
};

/** Timeline de suivi d'une demande (DS-Composants §07). */
export const RequestTimeline = ({ steps, label }: { steps: TimelineStep[]; label: string }) => (
  <ol aria-label={label} className="m-0 list-none p-0">
    {steps.map((step, index) => {
      const last = index === steps.length - 1;
      return (
        <li key={step.key} aria-current={step.state === 'current' ? 'step' : undefined} className="grid grid-cols-[24px_minmax(0,1fr)] gap-4">
          <span className="relative flex justify-center">
            {step.state === 'done' && <span className="relative z-10 mt-1 size-3 rounded-full bg-primary" />}
            {step.state === 'current' && (
              <span className="relative z-10 mt-0.5 flex size-4 items-center justify-center rounded-full border-2 border-primary bg-paper">
                <span className="size-1.5 rounded-full bg-primary" />
              </span>
            )}
            {step.state === 'upcoming' && <span className="mt-1 size-3 rounded-full border-[1.5px] border-line-field" />}
            {!last && (
              <span
                className={cn('absolute bottom-0 left-[11.5px] w-px', step.state === 'done' ? 'top-4 bg-primary' : 'top-[18px] bg-line')}
              />
            )}
          </span>
          <div className={cn(!last && 'pb-5')}>
            <p className={cn('tnum m-0 text-meta', step.state === 'current' ? 'text-primary' : 'text-ink-3')}>{step.when}</p>
            <p className={cn('m-0 mt-1 text-body', step.state === 'upcoming' ? 'text-ink-2' : 'font-semibold text-ink')}>{step.title}</p>
            {step.detail && <p className="m-0 mt-0.5 text-sm text-ink-2">{step.detail}</p>}
          </div>
        </li>
      );
    })}
  </ol>
);
