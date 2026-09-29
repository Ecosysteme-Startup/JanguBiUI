'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';

import { useParishWeek } from '../api/get-parish-week';
import { dayLabel } from '../utils/day-label';
import { KIND_LABEL, rangeLabel, scheduleByPlace, timeLabel } from '../utils/schedule';

/** Onglet « Horaires » : la semaine, par lieu de culte puis par jour (exceptions signalées). */
export const ScheduleSection = ({ nodeId }: { nodeId: string }) => {
  const { data: week, isPending, isError } = useParishWeek(nodeId);
  const places = week ? scheduleByPlace(week) : [];

  return (
    <section id="horaires" aria-labelledby="mp-horaires">
      <SectionHeading id="mp-horaires" size="md" title="Horaires de la semaine" />
      {isPending ? (
        <LoadingBlock label="Chargement des horaires…" />
      ) : isError ? (
        <EmptyState tone="err" title="Les horaires n’ont pas pu être chargés." />
      ) : places.length === 0 ? (
        <EmptyState icon="horloge" title="Aucun horaire publié cette semaine.">
          Renseignez-vous auprès du secrétariat de la paroisse.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {places.map(({ place, days }) => (
            <div key={place.id} className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
              <div className="border-b border-line px-6 py-4">
                <h3 className="m-0 text-16 font-semibold text-ink">{place.name}</h3>
                {(place.address || place.city) && (
                  <p className="m-0 text-14 text-ink-2">{[place.address, place.city].filter(Boolean).join(', ')}</p>
                )}
              </div>
              <dl className="m-0 px-6">
                {days.map(({ date, items }, index) => (
                  <div key={date} className={`grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-4 py-3 ${index > 0 ? 'border-t border-line' : ''}`}>
                    <dt className="text-15 font-semibold text-ink">{dayLabel(date)}</dt>
                    <dd className="m-0 flex flex-col gap-1">
                      {items.map((o) => (
                        <span key={`${o.kind}-${o.start_time}`} className="text-15 text-ink">
                          <span className="tnum font-medium">{o.kind === 'messe' ? timeLabel(o.start_time) : rangeLabel(o)}</span>
                          {' · '}
                          {KIND_LABEL[o.kind] ?? o.kind}
                          {o.note && <span className="text-ink-2"> — {o.note}</span>}
                          {o.is_exception && <span className="text-14 font-semibold text-warn"> (exceptionnel)</span>}
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
