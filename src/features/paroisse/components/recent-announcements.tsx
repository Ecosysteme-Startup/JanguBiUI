'use client';

import { SectionHeading } from '@/components/ui/section-heading';
import { dayjs } from '@/utils/dates';
import { plural } from '@/utils/plural';

import type { AnnouncementSummary } from '../api/get-announcements';

import { AnnouncementList } from './announcement-row';
import { type ParishTab, TabLink } from './tab-link';

const RECENT = 3;

/** « Annonces récentes » de l'aperçu : les trois dernières, lien vers l'onglet Annonces. */
export const RecentAnnouncements = ({
  items,
  total,
  onSelectTab,
}: {
  items: AnnouncementSummary[];
  total: number;
  onSelectTab: (tab: ParishTab) => void;
}) => {
  if (items.length === 0) return null;
  const sunday = items.find((a) => a.is_sunday_notice && a.sunday_date);
  return (
    <section aria-labelledby="mp-annonces-recentes">
      <SectionHeading
        id="mp-annonces-recentes"
        size="md"
        className={sunday ? 'mb-0' : undefined}
        title="Annonces récentes"
        aside={
          <TabLink tab="annonces" onSelect={onSelectTab}>
            {total > 1 ? `Voir les ${plural(total, 'annonce', 'annonces')}` : 'Voir l’annonce'}
          </TabLink>
        }
      />
      {sunday?.sunday_date && (
        <p className="m-0 mb-4 mt-1 text-15 text-ink-2">
          Lues à la fin des messes du dimanche {dayjs(sunday.sunday_date).format('D MMMM')}.
        </p>
      )}
      <AnnouncementList items={items.slice(0, RECENT)} />
    </section>
  );
};
