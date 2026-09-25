'use client';

import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { useNodeWeek } from '../api/get-node-week';
import { formatTime, nextMassToday, occurrenceLabel, PLACE_KINDS, scheduleByPlace } from '../utils/schedule';

const dayHeading = (date: string, today: string) =>
  date === today ? 'Aujourd’hui' : dayjs(date).format('dddd D').replace(/^./, (c) => c.toUpperCase());

/** « 01 — Horaires des messes » : la semaine à venir, par lieu de culte, exceptions comprises. */
export const ParishSchedule = ({ nodeId }: { nodeId: string }) => {
  const { data, isPending, isError } = useNodeWeek(nodeId);
  const today = dayjs().format('YYYY-MM-DD');

  if (isPending) {
    return (
      <section aria-labelledby="h-horaires">
        <SectionHeading id="h-horaires" number="01" title="Horaires des messes" />
        <LoadingBlock label="Chargement des horaires…" />
      </section>
    );
  }

  const schedules = data ? scheduleByPlace(data.places, data.occurrences) : [];
  const hasAny = schedules.some((s) => s.days.length > 0);
  const next = data ? nextMassToday(data.occurrences, today, dayjs().format('HH:mm')) : undefined;

  return (
    <section aria-labelledby="h-horaires">
      <SectionHeading
        id="h-horaires"
        number="01"
        title="Horaires des messes"
        aside={data && `Semaine du ${dayjs(data.start).format('D MMMM')} au ${dayjs(data.end).format('D MMMM')}`}
      />
      {isError ? (
        <p role="alert" className="m-0 mt-6 text-base text-err">
          Les horaires n&apos;ont pas pu être chargés. Réessayez dans un instant.
        </p>
      ) : !hasAny ? (
        <p className="m-0 mt-6 text-base text-ink-2">
          Aucun horaire n&apos;est encore publié pour cette paroisse. Renseignez-vous auprès de son secrétariat.
        </p>
      ) : (
        <>
          <div role="note" className="mt-6 rounded border border-primary bg-tint-50 px-5 py-3.5 text-base">
            <strong className="font-semibold text-primary-strong">{dayHeading(today, today)} :</strong>{' '}
            {next ? (
              <>
                prochaine messe à <span className="tnum">{formatTime(next.start_time)}</span>, {next.place_name}.
              </>
            ) : (
              'plus de messe prévue aujourd’hui.'
            )}
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            {schedules
              .filter((s) => s.days.length > 0)
              .map(({ place, days }) => (
                <div key={place.id}>
                  <h2 className="m-0 font-serif text-h3 font-normal text-ink">{place.name}</h2>
                  <p className="m-0 mt-1.5 text-sm text-ink-3">
                    {[place.is_main ? 'Lieu principal' : PLACE_KINDS[place.kind], place.address].filter(Boolean).join(' · ')}
                  </p>
                  <table className="mt-4 w-full border-collapse text-base">
                    <tbody>
                      {days.map(({ date, items }, index) => (
                        <tr key={date}>
                          <th
                            scope="row"
                            className={cn(
                              'tnum w-28 py-3.5 pr-4 text-left align-top text-meta font-normal',
                              index === 0 ? 'border-t border-ink' : 'border-t border-line',
                              date === today ? 'text-primary' : 'text-ink-3',
                            )}
                          >
                            {dayHeading(date, today)}
                          </th>
                          <td className={cn('py-3 leading-[1.7]', index === 0 ? 'border-t border-ink' : 'border-t border-line')}>
                            {items.map((item, i) => (
                              <span key={i} className="block">
                                <span className="tnum">{occurrenceLabel(item)}</span>
                                {item.is_exception && <span className="ml-2 text-sm text-warn">exceptionnel</span>}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        </>
      )}
    </section>
  );
};
