import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { Place } from '@/hooks/use-backoffice-places';
import { apiErrorMessage } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs, longDate } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type ScheduleException, useDeletePlaceException } from '../api/place-exceptions';
import { clock, KIND_LABELS } from '../utils/schedule';

/** « 7:00 · Messe supprimée », « 9:30 · Messe supplémentaire », « Confessions supprimées toute la journée ». */
export const exceptionTitle = (e: ScheduleException): string => {
  const kind = KIND_LABELS[e.kind];
  const plural = e.kind === 'confession';
  const change = e.cancelled ? (plural ? 'supprimées' : 'supprimée') : plural ? 'supplémentaires' : 'supplémentaire';
  if (!e.start_time) return `${kind} ${change} toute la journée`;
  const end = e.end_time ? `–${clock(e.end_time)}` : '';
  return `${clock(e.start_time)}${end} · ${kind} ${change}`;
};

const DateTile = ({ date }: { date: string }) => {
  const d = dayjs(date);
  const sunday = d.day() === 0;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-14 shrink-0 flex-col items-center justify-center rounded-14 leading-[18px]',
        sunday ? 'bg-tint-50 text-tint-800' : 'bg-surface-2 text-ink-2',
      )}
    >
      <span className="text-12">{d.format('ddd')}</span>
      <span className="tnum text-20 font-semibold">{d.date()}</span>
    </span>
  );
};

/** « Exceptions à venir » (PAR-Horaires) : carte encadrée, une rangée par date. */
export const ExceptionsCard = ({ places, byPlace, onAdd }: { places: Place[]; byPlace: Record<number, ScheduleException[]>; onAdd: () => void }) => {
  const remove = useDeletePlaceException();
  const rows = places
    .flatMap((place) => (byPlace[place.id] ?? []).map((exception) => ({ place, exception })))
    .sort((a, b) => a.exception.date.localeCompare(b.exception.date) || (a.exception.start_time ?? '').localeCompare(b.exception.start_time ?? ''));
  return (
    <section aria-labelledby="h-exc" className="mt-8 overflow-hidden rounded-16 border border-line bg-paper shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-5">
        <div>
          <h2 id="h-exc" className="m-0 text-20 font-semibold text-ink">
            Exceptions à venir
          </h2>
          <p className="m-0 mt-0.5 text-14 text-ink-3">Elles remplacent la semaine type pour une date précise et sont signalées aux fidèles.</p>
        </div>
        <button type="button" onClick={onAdd} className="hit whitespace-nowrap text-14 font-semibold text-primary hover:text-primary-strong hover:underline">
          Ajouter une exception
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="m-0 border-t border-line px-6 py-5 text-14 text-ink-3">Aucune exception à venir : la semaine type s’applique.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {rows.map(({ place, exception }) => (
            <li
              key={`${place.id}-${exception.id}`}
              className="grid grid-cols-[56px_minmax(0,1fr)_40px] items-center gap-x-5 gap-y-2 border-t border-line px-6 py-4 md:grid-cols-[56px_minmax(0,1fr)_200px_40px]"
            >
              <DateTile date={exception.date} />
              <span className="flex min-w-0 flex-col">
                <span className="tnum text-15 font-semibold text-ink">{exceptionTitle(exception)}</span>
                <span className="text-14 text-ink-2">{frenchTypo([exception.note, place.name].filter(Boolean).join(' · '))}</span>
              </span>
              <span className="col-start-2 row-start-2 flex flex-col items-start gap-1 md:col-start-3 md:row-start-1">
                <Badge tone="ok" dot>
                  Annoncée aux fidèles
                </Badge>
                <span className="text-13 text-ink-3">{longDate(exception.date)}</span>
              </span>
              <button
                type="button"
                onClick={() => remove.mutate({ placeId: place.id, exceptionId: exception.id })}
                aria-label={`Supprimer l’exception du ${dayjs(exception.date).format('D MMMM')}`}
                className="hit col-start-3 row-start-1 inline-flex size-9 items-center justify-center rounded-10 text-ink-2 hover:bg-surface-2 hover:text-err md:col-start-4"
              >
                <Icon name="corbeille" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {remove.isError && (
        <p role="alert" className="m-0 border-t border-line px-6 py-3 text-14 text-err">
          {apiErrorMessage(remove.error)}
        </p>
      )}
    </section>
  );
};
