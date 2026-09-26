'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { PLACE_KIND_LABELS, type Place, useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { plural } from '@/utils/plural';

import { type Schedule, usePlaceSchedules } from '../api/get-place-schedule';
import { type ScheduleException, useDeletePlaceException, usePlaceExceptions } from '../api/place-exceptions';
import { toItem, useReplacePlaceSchedule } from '../api/replace-place-schedule';
import { formatRange, formatTime, KIND_LABELS, massesPerWeek, WEEKDAYS, WEEKDAYS_SHORT } from '../utils/schedule';

import { ExceptionForm } from './exception-form';
import { ScheduleForm } from './schedule-form';

type Panel = 'horaire' | 'exception' | null;


const PlaceWeek = ({ place, schedules, onRemove, busy }: { place: Place; schedules: Schedule[]; onRemove: (s: Schedule) => void; busy: boolean }) => (
  <div role="group" aria-label={`Horaires hebdomadaires, ${place.name}`} className="mt-4 grid grid-cols-2 border-t border-line-strong sm:grid-cols-4 lg:grid-cols-7">
    {WEEKDAYS_SHORT.map((day, weekday) => {
      const items = schedules.filter((s) => s.weekday === weekday).sort((a, b) => a.start_time.localeCompare(b.start_time));
      return (
        <div key={day} className="min-h-28 border-b border-r border-line px-2 py-2">
          <h3 className="tnum m-0 text-meta font-normal text-ink-3">
            <abbr title={WEEKDAYS[weekday]} className="no-underline">
              {day}
            </abbr>
          </h3>
          {items.length === 0 ? (
            <p className="m-0 mt-2 text-sm text-ink-3">—</p>
          ) : (
            <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
              {items.map((s) => (
                <li key={s.id} className="group flex items-start justify-between gap-1">
                  <span className="flex flex-col">
                    <span className="tnum font-serif text-lead leading-none text-ink">{formatRange(s.start_time, s.end_time)}</span>
                    <span className="text-xs text-ink-2">{s.note || KIND_LABELS[s.kind]}</span>
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRemove(s)}
                    aria-label={`Supprimer : ${KIND_LABELS[s.kind].toLowerCase()} du ${WEEKDAYS[s.weekday].toLowerCase()} à ${formatTime(s.start_time)}`}
                    className="hit inline-flex size-7 shrink-0 items-center justify-center rounded text-ink-3 hover:bg-surface-2 hover:text-err"
                  >
                    <Icon name="x" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    })}
  </div>
);

const exceptionText = (e: ScheduleException) => {
  const kind = KIND_LABELS[e.kind].toLowerCase();
  if (e.cancelled) return e.start_time ? `Pas de ${kind} de ${formatTime(e.start_time)}` : `Pas de ${kind} ce jour`;
  return frenchTypo(`${e.start_time ? formatRange(e.start_time, e.end_time) : ''} : ${kind} supplémentaire`);
};

const ExceptionsList = ({ places, byPlace }: { places: Place[]; byPlace: Record<number, ScheduleException[]> }) => {
  const remove = useDeletePlaceException();
  const rows = places
    .flatMap((place) => (byPlace[place.id] ?? []).map((exception) => ({ place, exception })))
    .sort((a, b) => a.exception.date.localeCompare(b.exception.date));
  return (
    <section aria-labelledby="h-exc" className="mt-10">
      <h2 id="h-exc" className="tnum m-0 flex justify-between border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
        <span>
          <span className="text-primary">{String(places.length + 1).padStart(2, '0')}</span> — Exceptions à venir
        </span>
        <span className="text-ink-3">Annoncées aux fidèles sur la fiche et dans « Ma paroisse »</span>
      </h2>
      {rows.length === 0 ? (
        <p className="m-0 mt-3 text-sm text-ink-3">Aucune exception à venir : la semaine type s’applique.</p>
      ) : (
        <ul className="m-0 mt-2 list-none p-0">
          {rows.map(({ place, exception }) => {
            const day = dayjs(exception.date).format('ddd DD.MM');
            return (
              <li key={`${place.id}-${exception.id}`} className="flex items-center gap-4 border-b border-line py-3">
                <span className="tnum w-24 shrink-0 text-sm text-ink-2">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                <span className="w-40 shrink-0 truncate text-sm text-ink-3">{place.name}</span>
                <span className="min-w-0 flex-1 text-base text-ink">
                  <strong className={cn(exception.cancelled && 'text-err')}>{exceptionText(exception)}</strong>
                  {exception.note && <span className="text-ink-2"> · {exception.note}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => remove.mutate({ placeId: place.id, exceptionId: exception.id })}
                  aria-label={`Supprimer l’exception du ${dayjs(exception.date).format('D MMMM')}`}
                  className="hit inline-flex size-9 items-center justify-center rounded text-ink hover:bg-surface-2"
                >
                  <Icon name="corbeille" size={18} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {remove.isError && (
        <p role="alert" className="m-0 mt-2 text-sm text-err">
          {apiErrorMessage(remove.error)}
        </p>
      )}
    </section>
  );
};

/** PAR-Horaires : lieux de culte du nœud, semaine type par lieu, exceptions, panneaux de saisie. */
export const HorairesScreen = ({ nodeId }: { nodeId: string }) => {
  const [panel, setPanel] = useState<Panel>(null);
  const places = useBackofficePlaces(nodeId);
  const placeIds = (places.data ?? []).map((p) => p.id);
  const schedules = usePlaceSchedules(placeIds);
  const exceptions = usePlaceExceptions(placeIds);
  const replace = useReplacePlaceSchedule({ onSuccess: () => toast.ok('Horaire supprimé.') });

  if (places.isPending) return <LoadingBlock label="Chargement des lieux de culte…" lines={6} />;
  if (places.isError) {
    return (
      <EmptyState icon="alerte" tone="err" title="Lieux de culte indisponibles">
        {apiErrorMessage(places.error)}
      </EmptyState>
    );
  }

  const all = Object.values(schedules.byPlace).flat();
  const removeSchedule = (placeId: number, target: Schedule) =>
    replace.mutate({ placeId, items: (schedules.byPlace[placeId] ?? []).filter((s) => s.id !== target.id).map(toItem) });

  return (
    <div className={cn('grid items-start gap-8', panel && 'xl:grid-cols-[minmax(0,1fr)_380px]')}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="tnum m-0 text-meta text-ink-2">
              <span className="text-primary">02</span> — Vie paroissiale · {plural(places.data.length, 'lieu', 'lieux')} de culte ·{' '}
              {plural(massesPerWeek(all), 'messe', 'messes')} par semaine
            </p>
            <h1 className="m-0 mt-2 font-serif text-title font-normal text-ink">Horaires et lieux de culte</h1>
          </div>
          {places.data.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" aria-expanded={panel === 'exception'} aria-controls="h-panneau" onClick={() => setPanel('exception')}>
                Ajouter une exception
              </Button>
              <Button aria-expanded={panel === 'horaire'} aria-controls="h-panneau" onClick={() => setPanel('horaire')}>
                <Icon name="plus" size={16} /> Ajouter un horaire
              </Button>
            </div>
          )}
        </div>

        {schedules.error && (
          <p role="alert" className="m-0 mt-4 text-sm text-err">
            {isForbidden(schedules.error) ? 'Accès refusé aux horaires de ce lieu.' : apiErrorMessage(schedules.error)}
          </p>
        )}
        {replace.isError && (
          <p role="alert" className="m-0 mt-4 text-sm text-err">
            {apiErrorMessage(replace.error)}
          </p>
        )}

        {places.data.length === 0 ? (
          <EmptyState icon="paroisse" title="Aucun lieu de culte enregistré" className="mt-8">
            Un lieu de culte est créé par la chancellerie, sur demande du curé. Les horaires se saisissent ensuite ici.
          </EmptyState>
        ) : schedules.isPending ? (
          <div className="mt-8">
            <LoadingBlock label="Chargement des horaires…" lines={5} />
          </div>
        ) : (
          places.data.map((place, index) => {
            const list = schedules.byPlace[place.id] ?? [];
            return (
              <section key={place.id} aria-labelledby={`h-lieu-${place.id}`} className="mt-10">
                <p className="tnum m-0 border-t border-line-strong pt-2 text-meta text-ink-2">
                  <span className="text-primary">{String(index + 1).padStart(2, '0')}</span> — {place.is_main ? 'Lieu principal' : 'Lieu secondaire'} ·{' '}
                  {PLACE_KIND_LABELS[place.kind] ?? place.kind}
                </p>
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <h2 id={`h-lieu-${place.id}`} className="m-0 font-serif text-h3 font-normal text-ink">
                      {place.name}
                    </h2>
                    <p className="m-0 mt-1 text-sm text-ink-2">
                      {[place.address, place.city].filter(Boolean).join(', ')} · {plural(massesPerWeek(list), 'messe', 'messes')} par semaine
                    </p>
                  </div>
                  <NextLink href={paths.espace.parametres.getHref(nodeId)} className="text-sm font-medium">
                    Modifier le lieu
                  </NextLink>
                </div>
                <PlaceWeek place={place} schedules={list} busy={replace.isPending} onRemove={(s) => removeSchedule(place.id, s)} />
              </section>
            );
          })
        )}

        {places.data.length > 0 && !exceptions.isPending && <ExceptionsList places={places.data} byPlace={exceptions.byPlace} />}
      </div>

      {panel && (
        <aside id="h-panneau" aria-labelledby="h-form-titre" className="rounded border border-line-strong bg-surface p-6 xl:sticky xl:top-6">
          {panel === 'horaire' ? (
            <ScheduleForm places={places.data} schedulesByPlace={schedules.byPlace} onClose={() => setPanel(null)} />
          ) : (
            <ExceptionForm places={places.data} onClose={() => setPanel(null)} />
          )}
        </aside>
      )}
    </div>
  );
};
