'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { Chip, ChipGroup } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type AnnouncementSummary, useAnnouncements } from '../api/get-announcements';

const FILTERS = {
  tout: { label: 'Tout', test: () => true },
  dimanche: { label: 'Annonces du dimanche', test: (a: AnnouncementSummary) => a.is_sunday_notice },
  vie: { label: 'Vie paroissiale', test: (a: AnnouncementSummary) => !a.is_sunday_notice },
} as const;
type Filter = keyof typeof FILTERS;

const NEW_DAYS = 7;

/** Rubrique et date : « Quête · 27 sept. » (dimanche concerné pour une annonce du dimanche). */
export const announcementKicker = (a: AnnouncementSummary) => {
  const date = a.is_sunday_notice && a.sunday_date ? a.sunday_date : a.published_at;
  return [a.category?.name, date ? dayjs(date).format('D MMM') : null].filter(Boolean).join(' · ');
};

const isNew = (a: AnnouncementSummary) => Boolean(a.published_at && dayjs().diff(dayjs(a.published_at), 'day') < NEW_DAYS);

export const AnnouncementRow = ({ item }: { item: AnnouncementSummary }) => (
  <li className="border-b border-line">
    <NextLink href={paths.app.paroisse.annonce.getHref(item.id)} className="group block py-4 text-ink">
      <span className="tnum flex items-center gap-3 text-meta text-ink-3">
        {isNew(item) && <span className="font-semibold text-primary">Nouveau</span>}
        {announcementKicker(item)}
      </span>
      <span className="mt-1 block font-serif text-h4 group-hover:text-primary">{frenchTypo(item.title)}</span>
      {item.excerpt && <span className="mt-1 block text-base text-ink-2">{frenchTypo(item.excerpt)}</span>}
    </NextLink>
  </li>
);

export const AnnouncementsSection = ({ nodeId, className }: { nodeId: string; className?: string }) => {
  const [filter, setFilter] = useState<Filter>('tout');
  const { data, isPending, isError } = useAnnouncements(nodeId);
  const items = data?.results ?? [];
  const shown = items.filter(FILTERS[filter].test);

  return (
    <section id="annonces" aria-labelledby="mp-annonces" className={cn('scroll-mt-24', className)}>
      <SectionHeading id="mp-annonces" number="01" title="Annonces" aside={data ? `${data.count} publiée${data.count > 1 ? 's' : ''}` : undefined} />
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
          <ChipGroup label="Filtrer les annonces" className="mt-4">
            {(Object.keys(FILTERS) as Filter[]).map((key) => (
              <Chip key={key} pressed={filter === key} onClick={() => setFilter(key)}>
                {FILTERS[key].label}
                <span className="tnum text-meta opacity-80">{items.filter(FILTERS[key].test).length}</span>
              </Chip>
            ))}
          </ChipGroup>
          {shown.length === 0 ? (
            <p className="m-0 mt-6 text-base text-ink-2">Aucune annonce dans cette rubrique.</p>
          ) : (
            <ol className="m-0 mt-2 list-none p-0">
              {shown.map((item) => (
                <AnnouncementRow key={item.id} item={item} />
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
};
