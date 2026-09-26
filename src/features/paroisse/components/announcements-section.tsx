'use client';

import { useState } from 'react';

import { Chip, ChipGroup } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { plural } from '@/utils/plural';

import { type AnnouncementSummary, useAnnouncements } from '../api/get-announcements';

import { AnnouncementList } from './announcement-row';

const FILTERS = {
  tout: { label: 'Tout', test: () => true },
  dimanche: { label: 'Annonces du dimanche', test: (a: AnnouncementSummary) => a.is_sunday_notice },
  vie: { label: 'Vie paroissiale', test: (a: AnnouncementSummary) => !a.is_sunday_notice },
} as const;
type Filter = keyof typeof FILTERS;

/** Onglet « Annonces » : toutes les annonces publiées, filtrables. */
export const AnnouncementsSection = ({ nodeId }: { nodeId: string }) => {
  const [filter, setFilter] = useState<Filter>('tout');
  const { data, isPending, isError } = useAnnouncements(nodeId);
  const items = data?.results ?? [];
  const shown = items.filter(FILTERS[filter].test);

  return (
    <section id="annonces" aria-labelledby="mp-annonces">
      <SectionHeading
        id="mp-annonces"
        size="md"
        title="Annonces"
        aside={data ? <span className="text-15 text-ink-3">{plural(data.count, 'publiée', 'publiées')}</span> : undefined}
      />
      {isPending ? (
        <LoadingBlock label="Chargement des annonces…" />
      ) : isError ? (
        <EmptyState tone="err" title="Les annonces n’ont pas pu être chargées." />
      ) : items.length === 0 ? (
        <EmptyState icon="annonce" title="Aucune annonce pour le moment.">
          Les annonces de votre paroisse s’afficheront ici dès leur publication.
        </EmptyState>
      ) : (
        <>
          <ChipGroup label="Filtrer les annonces">
            {(Object.keys(FILTERS) as Filter[]).map((key) => (
              <Chip key={key} pressed={filter === key} count={items.filter(FILTERS[key].test).length} onClick={() => setFilter(key)}>
                {FILTERS[key].label}
              </Chip>
            ))}
          </ChipGroup>
          {shown.length === 0 ? (
            <p className="m-0 mt-6 text-15 text-ink-2">Aucune annonce dans cette rubrique.</p>
          ) : (
            <AnnouncementList items={shown} className="mt-4" />
          )}
        </>
      )}
    </section>
  );
};
