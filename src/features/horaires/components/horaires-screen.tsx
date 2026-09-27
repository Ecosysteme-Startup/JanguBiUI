'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { PLACE_KIND_LABELS, type Place, useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { plural } from '@/utils/plural';

import { type Schedule, usePlaceSchedules } from '../api/get-place-schedule';
import { usePlaceExceptions } from '../api/place-exceptions';
import { toItem, useReplacePlaceSchedule } from '../api/replace-place-schedule';
import { massesPerWeek } from '../utils/schedule';

import { ExceptionForm } from './exception-form';
import { ExceptionsCard } from './exceptions-card';
import { ScheduleForm } from './schedule-form';
import { KindLegend, type PlacedSchedule, WeekGrid } from './week-grid';

type Panel = 'horaire' | 'exception' | null;

const PlaceCard = ({ nodeId, place, count }: { nodeId: string; place: Place; count: number }) => (
  <li className="flex items-center gap-4 rounded-16 border border-line bg-paper px-5 py-4 shadow-card">
    <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-12 bg-tint-50 text-primary-strong">
      <Icon name="paroisse" size={22} />
    </span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="flex flex-wrap items-center gap-2">
        <h3 id={`h-lieu-${place.id}`} className="m-0 text-16 font-semibold text-ink">
          {place.name}
        </h3>
        {place.is_main && <Badge tone="info">Principal</Badge>}
      </span>
      {(place.address || place.city) && <span className="text-14 text-ink-2">{[place.address, place.city].filter(Boolean).join(', ')}</span>}
      <span className="text-13 text-ink-3">
        {PLACE_KIND_LABELS[place.kind] ?? place.kind}
        {place.is_main ? ' · lieu principal' : ''}
      </span>
    </span>
    <span className="tnum whitespace-nowrap text-14 text-ink-2">{plural(count, 'horaire', 'horaires')}</span>
    <NextLink
      href={paths.espace.parametres.getHref(nodeId)}
      aria-label={`Modifier ${place.name}`}
      className="hit inline-flex size-9 shrink-0 items-center justify-center rounded-10 text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      <Icon name="crayon" size={18} />
    </NextLink>
  </li>
);

/** PAR-Horaires : lieux de culte du nœud, semaine type, exceptions, saisie en boîte de dialogue. */
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

  const placed: PlacedSchedule[] = places.data.flatMap((place) => (schedules.byPlace[place.id] ?? []).map((s) => ({ ...s, place })));
  const removeSchedule = (placeId: number, target: Schedule) =>
    replace.mutate({ placeId, items: (schedules.byPlace[placeId] ?? []).filter((s) => s.id !== target.id).map(toItem) });
  const close = () => setPanel(null);

  return (
    <div>
      <PageHeader
        compact
        title="Horaires et lieux"
        description="Les horaires publiés dans l’application, sur la fiche publique et dans la bande de dates des fidèles."
        actions={
          places.data.length > 0 && (
            <Button className="min-h-11 px-5" onClick={() => setPanel('horaire')}>
              <Icon name="plus" size={18} /> Ajouter un horaire
            </Button>
          )
        }
      />

      {schedules.error && (
        <p role="alert" className="m-0 mt-4 text-14 text-err">
          {isForbidden(schedules.error) ? 'Accès refusé aux horaires de ce lieu.' : apiErrorMessage(schedules.error)}
        </p>
      )}
      {replace.isError && (
        <p role="alert" className="m-0 mt-4 text-14 text-err">
          {apiErrorMessage(replace.error)}
        </p>
      )}

      {places.data.length === 0 ? (
        <EmptyState icon="paroisse" title="Aucun lieu de culte enregistré" className="mt-8 rounded-16 border border-line">
          Un lieu de culte est créé par la chancellerie, sur demande du curé. Les horaires se saisissent ensuite ici.
        </EmptyState>
      ) : (
        <>
          <section aria-labelledby="h-lieux" className="mt-8">
            <h2 id="h-lieux" className="m-0 mb-3 text-20 font-semibold text-ink">
              Lieux de culte
            </h2>
            <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
              {places.data.map((place) => (
                <PlaceCard key={place.id} nodeId={nodeId} place={place} count={(schedules.byPlace[place.id] ?? []).length} />
              ))}
            </ul>
          </section>

          <section aria-labelledby="h-semaine" className="mt-8">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <div>
                <h2 id="h-semaine" className="m-0 text-20 font-semibold text-ink">
                  Semaine type
                </h2>
                <p className="m-0 mt-0.5 text-14 text-ink-3">
                  {plural(places.data.length, 'lieu', 'lieux')} de culte · {plural(massesPerWeek(placed), 'messe', 'messes')} par semaine, hors exceptions.
                </p>
              </div>
              <KindLegend />
            </div>
            {schedules.isPending ? (
              <LoadingBlock label="Chargement des horaires…" lines={5} />
            ) : (
              <WeekGrid
                label="Semaine type, tous les lieux"
                slots={placed}
                exceptionsByPlace={exceptions.byPlace}
                showPlace
                busy={replace.isPending}
                onRemove={(s) => removeSchedule(s.place.id, s)}
              />
            )}
          </section>

          {!exceptions.isPending && <ExceptionsCard places={places.data} byPlace={exceptions.byPlace} onAdd={() => setPanel('exception')} />}
        </>
      )}

      <Modal
        open={panel === 'horaire'}
        onOpenChange={(open) => !open && close()}
        title="Ajouter un horaire"
        description="Il apparaîtra dans l’application dès l’enregistrement."
        size="form"
      >
        <ScheduleForm places={places.data} schedulesByPlace={schedules.byPlace} onClose={close} />
      </Modal>
      <Modal
        open={panel === 'exception'}
        onOpenChange={(open) => !open && close()}
        title="Ajouter une exception"
        description="Une annulation ou un horaire supplémentaire pour une date précise, signalé aux fidèles."
        size="form"
      >
        <ExceptionForm places={places.data} onClose={close} />
      </Modal>
    </div>
  );
};
