'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { type Occurrence, useNodeWeek } from '../api/get-node-week';
import { useNow } from '../hooks/use-parish-now';
import { slotWhen, upcomingMasses, weeklyRows } from '../utils/schedule';

import { MassSlot } from './mass-slot';

/** Durée d'un créneau (« 2 h », « 45 min ») quand sa fin est connue. */
const duration = (o: Occurrence) => {
  if (!o.end_time) return '';
  const minutes = dayjs(`2000-01-01T${o.end_time}`).diff(
    dayjs(`2000-01-01T${o.start_time}`),
    'minute',
  );
  if (minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h${m ? ` ${m}` : ''}` : `${m} min`;
};

/**
 * « Horaires des messes » de la fiche (WEB-Fiche-Paroisse) : sept jours, les créneaux du jour
 * choisi (passé, prochain, exceptionnel), puis la semaine type. « Semaine suivante » recharge
 * les horaires à partir du jour +7 (`?start=`).
 */
export const ParishSchedule = ({ nodeId }: { nodeId: string }) => {
  const now = useNow();
  const [start, setStart] = useState<string | undefined>(undefined);
  const { data, isPending, isError } = useNodeWeek(nodeId, start);
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(null), [start]);

  const days = data
    ? Array.from({ length: 7 }, (_, i) =>
        dayjs(data.start).add(i, 'day').format('YYYY-MM-DD'),
      )
    : [];
  const busy = new Set(data?.occurrences.map((o) => o.date));
  const selected = day ?? days.find((d) => busy.has(d)) ?? days[0];
  const slots = (data?.occurrences ?? [])
    .filter((o) => o.date === selected)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const next =
    data && now
      ? upcomingMasses(data.occurrences, now.today, now.time)[0]
      : undefined;
  const rows = data ? weeklyRows(data.occurrences) : [];

  return (
    <section aria-labelledby="h-horaires">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="h-horaires" className="m-0 text-24 font-semibold text-ink">
          Horaires des messes
        </h2>
        {data && (
          <button
            type="button"
            onClick={() =>
              setStart(
                start
                  ? undefined
                  : dayjs(data.start).add(7, 'day').format('YYYY-MM-DD'),
              )
            }
            className="hit text-15 font-semibold text-primary hover:text-primary-strong"
          >
            {start ? 'Cette semaine' : 'Semaine suivante'}
          </button>
        )}
      </div>
      {isPending ? (
        <div className="mt-5">
          <LoadingBlock label="Chargement des horaires…" />
        </div>
      ) : isError || !data ? (
        <p role="alert" className="m-0 mt-5 text-16 text-err">
          Les horaires n&apos;ont pas pu être chargés. Réessayez dans un
          instant.
        </p>
      ) : data.occurrences.length === 0 ? (
        <p className="m-0 mt-5 text-16 text-ink-2">
          Aucun horaire n&apos;est encore publié pour cette paroisse.
          Renseignez-vous auprès de son secrétariat.
        </p>
      ) : (
        <>
          <div
            role="group"
            aria-label="Jours de la semaine"
            className="tnum mt-5 grid grid-cols-7 gap-1 text-center sm:gap-2"
          >
            {days.map((date) => {
              const isSelected = date === selected;
              const isToday = date === now?.today;
              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${dayjs(date).format('dddd D MMMM')}${isToday ? ', aujourd’hui' : ''}`}
                  onClick={() => setDay(date)}
                  className={cn(
                    'flex min-w-0 flex-col items-center gap-0.5 rounded-14 border pb-3 pt-2.5',
                    isSelected
                      ? 'border-primary bg-tint-50 text-tint-800 ring-1 ring-inset ring-primary'
                      : 'border-line text-ink hover:border-line-active',
                  )}
                >
                  <span
                    className={cn(
                      'max-w-full truncate text-12',
                      isSelected ? 'font-medium' : 'text-ink-3',
                    )}
                  >
                    {isToday ? (
                      <>
                        <span className="sm:hidden">auj.</span>
                        <span className="hidden sm:inline">
                          aujourd&apos;hui
                        </span>
                      </>
                    ) : (
                      dayjs(date).format('ddd')
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-18',
                      isSelected ? 'font-bold' : 'font-semibold',
                    )}
                  >
                    {dayjs(date).format('D')}
                  </span>
                  <span
                    className={cn(
                      'size-[5px] rounded-full',
                      busy.has(date)
                        ? isSelected
                          ? 'bg-primary-fill'
                          : 'bg-tint-300'
                        : 'bg-transparent',
                    )}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {slots.length === 0 ? (
              <p className="m-0 rounded-16 border border-line px-5 py-4 text-15 text-ink-2">
                Aucun horaire publié ce jour.
              </p>
            ) : (
              slots.map((slot) => {
                const past = now
                  ? slotWhen(slot, now.today, now.time) === 'passée'
                  : false;
                const isNext = next !== undefined && next === slot;
                return (
                  <MassSlot
                    key={`${slot.start_time}-${slot.place_id}-${slot.kind}`}
                    occurrence={slot}
                    when={duration(slot)}
                    size="md"
                    tone={past ? 'past' : isNext ? 'next' : 'default'}
                    aside={
                      slot.is_exception ? (
                        <Badge tone="warn">Exceptionnel</Badge>
                      ) : past ? (
                        <Badge tone="neutral" className="font-medium">
                          Passée
                        </Badge>
                      ) : isNext ? (
                        <span className="inline-flex items-center gap-1.5 text-14 font-medium text-tint-800">
                          <Icon name="horloge" size={16} />
                          Prochaine
                        </span>
                      ) : undefined
                    }
                  />
                );
              })
            )}
          </div>
          {rows.length > 0 && (
            <>
              <h3 className="m-0 mt-8 text-16 font-semibold text-ink">
                {start ? 'Semaine suivante' : 'Chaque semaine'}
              </h3>
              <dl className="m-0 mt-3 rounded-16 border border-line bg-surface text-15">
                {rows.map((row, index) => (
                  <div
                    key={row.label}
                    className={cn(
                      'grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4',
                      index < rows.length - 1 && 'border-b border-line',
                    )}
                  >
                    <dt className="font-semibold text-ink">{row.label}</dt>
                    <dd className="tnum m-0 text-ink-2">{row.text}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </>
      )}
    </section>
  );
};
