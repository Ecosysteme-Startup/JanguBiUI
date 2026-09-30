'use client';

import { useState } from 'react';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Chip, ChipGroup } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';
import { plural } from '@/utils/plural';

import { type EventType, useAgenda } from '../api/get-agenda';

import { EventRow } from './event-row';

const FILTERS: { value: EventType | null; label: string }[] = [
  { value: null, label: 'Tout' },
  { value: 'mass', label: 'Messes' },
  { value: 'conference', label: 'Conférences' },
  { value: 'retreat', label: 'Retraites' },
  { value: 'ordination', label: 'Ordinations' },
  { value: 'other', label: 'Autres' },
];

/**
 * Agenda complet du fidèle (/app/paroisse/agenda) : événements à venir de sa paroisse (et de ses
 * lieux), filtrables par type, chargés par pages de 20. Chaque carte ouvre le détail existant
 * (inscription comprise).
 */
export const FullAgenda = () => {
  const [type, setType] = useState<EventType | null>(null);
  const { data: me, isPending: mePending } = useMe();
  const paroisse = me?.paroisse_suivie ?? null;
  const agenda = useAgenda(paroisse?.id ?? null, type ?? undefined);
  const events = agenda.data?.pages.flatMap((p) => p.results) ?? [];
  const total = agenda.data?.pages[0]?.count;

  return (
    <div className="jb-cascade flex min-w-0 flex-col gap-6">
      <TopbarContent
        start={
          <Breadcrumbs items={[{ label: 'Ma paroisse', href: paths.app.paroisse.root.getHref() }, { label: 'Agenda' }]} />
        }
      />
      <PageHeader
        title="Agenda"
        description={paroisse ? `Les événements à venir de ${paroisse.name}.` : 'Les événements à venir de votre paroisse.'}
      />
      <ChipGroup label="Filtrer par type d’événement">
        {FILTERS.map((filter) => (
          <Chip key={filter.label} pressed={type === filter.value} onClick={() => setType(filter.value)}>
            {filter.label}
          </Chip>
        ))}
      </ChipGroup>
      <section aria-labelledby="ag-liste" className="min-w-0">
        <h2 id="ag-liste" className="sr-only">
          Événements à venir
        </h2>
        {!mePending && !paroisse ? (
          <EmptyState icon="paroisse" title="Aucune paroisse suivie.">
            Choisissez votre paroisse pour voir son agenda.
          </EmptyState>
        ) : agenda.isPending ? (
          <LoadingBlock label="Chargement de l’agenda…" lines={4} />
        ) : agenda.isError ? (
          <EmptyState tone="err" title="L’agenda n’a pas pu être chargé.">
            Vérifiez votre connexion puis réessayez.
          </EmptyState>
        ) : events.length === 0 ? (
          <EmptyState icon="calendrier" title={type ? 'Aucun événement de ce type à venir.' : 'Aucun événement à venir.'}>
            Les rencontres, retraites et célébrations de votre paroisse apparaîtront ici.
          </EmptyState>
        ) : (
          <>
            {total !== undefined && (
              <p className="m-0 mb-3 text-14 text-ink-3" aria-live="polite">
                {plural(total, 'événement à venir', 'événements à venir')}
              </p>
            )}
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {events.map((event, index) => (
                <EventRow key={event.id} event={event} highlight={index === 0} showOrigin />
              ))}
            </ul>
            {agenda.hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" loading={agenda.isFetchingNextPage} onClick={() => void agenda.fetchNextPage()}>
                  Afficher plus d’événements
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
