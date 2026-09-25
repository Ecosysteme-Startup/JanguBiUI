'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

import { useParishWeek } from '../api/get-parish-week';
import { dayLabel } from '../utils/day-label';
import { KIND_LABEL, rangeLabel, scheduleByPlace, timeLabel } from '../utils/schedule';

/** Horaires de la semaine, par lieu de culte puis par jour (exceptions signalées). */
export const ScheduleSection = ({ nodeId, className }: { nodeId: string; className?: string }) => {
  const { data: week, isPending, isError } = useParishWeek(nodeId);
  const places = week ? scheduleByPlace(week) : [];

  return (
    <section id="horaires" aria-labelledby="mp-horaires" className={cn('scroll-mt-24', className)}>
      <SectionHeading id="mp-horaires" number="02" title="Horaires de la semaine" />
      {isPending ? (
        <LoadingBlock label="Chargement des horaires…" />
      ) : isError ? (
        <EmptyState tone="err" title="Les horaires n’ont pas pu être chargés." />
      ) : places.length === 0 ? (
        <EmptyState icon="horloge" title="Aucun horaire publié cette semaine.">
          Renseignez-vous auprès du secrétariat de la paroisse.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-8">
          {places.map(({ place, days }) => (
            <div key={place.id}>
              <h3 className="m-0 mt-2 font-serif text-h4 font-normal text-ink">{place.name}</h3>
              {(place.address || place.city) && (
                <p className="m-0 mt-1 text-sm text-ink-3">{[place.address, place.city].filter(Boolean).join(', ')}</p>
              )}
              <dl className="m-0 mt-3">
                {days.map(({ date, items }) => (
                  <div key={date} className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 border-t border-line py-3">
                    <dt className="text-sm font-semibold text-ink">{dayLabel(date)}</dt>
                    <dd className="m-0 flex flex-col gap-1">
                      {items.map((o) => (
                        <span key={`${o.kind}-${o.start_time}`} className="text-base text-ink">
                          <span className="tnum">{o.kind === 'messe' ? timeLabel(o.start_time) : rangeLabel(o)}</span>
                          {' · '}
                          {KIND_LABEL[o.kind] ?? o.kind}
                          {o.note && <span className="text-ink-2"> — {o.note}</span>}
                          {o.is_exception && <span className="text-sm font-medium text-warn"> (exceptionnel)</span>}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
