import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import type { AnnouncementSummary } from '../api/get-announcements';

const NEW_DAYS = 7;

/** Rubrique et date : « Liturgie · mar. 22 sept. » (dimanche concerné pour une annonce du dimanche). */
export const announcementKicker = (a: AnnouncementSummary) => {
  const date = a.is_sunday_notice && a.sunday_date ? a.sunday_date : a.published_at;
  return [a.category?.name, date ? dayjs(date).format('ddd D MMM') : null].filter(Boolean).join(' · ');
};

export const isNewAnnouncement = (a: AnnouncementSummary, now: Date = new Date()) =>
  Boolean(a.published_at && dayjs(now).diff(dayjs(a.published_at), 'day') < NEW_DAYS);

/**
 * Rangée d'annonce dans une carte (FID-Ma-Paroisse) : méta 13 (« Épinglée » à l'épingle, sinon
 * « Nouveau »), titre 16/600, extrait 15 sur une ligne, chevron. Filet intercalaire en retrait de 24 px (sauf la première rangée).
 */
export const AnnouncementRow = ({ item, first }: { item: AnnouncementSummary; first: boolean }) => {
  const kicker = announcementKicker(item);
  return (
    <li className={cn('relative', !first && 'before:absolute before:left-6 before:right-0 before:top-0 before:h-px before:bg-line')}>
      <NextLink
        href={paths.app.paroisse.annonce.getHref(item.id)}
        className="flex items-center gap-4 px-6 py-4 text-ink hover:bg-surface hover:text-ink hover:no-underline"
      >
        <span className="min-w-0 flex-1">
          <span className="tnum flex flex-wrap items-center gap-x-1.5 text-13 text-ink-3">
            {item.is_pinned ? (
              <>
                <Icon name="epingle" size={14} className="text-primary" />
                <span className="font-medium text-primary">Épinglée</span>
              </>
            ) : (
              isNewAnnouncement(item) && <span className="font-medium text-primary">Nouveau</span>
            )}
            {(item.is_pinned || isNewAnnouncement(item)) && kicker && <span aria-hidden="true">·</span>}
            {kicker}
          </span>
          <span className="mt-1 block text-16 font-semibold">{frenchTypo(item.title)}</span>
          {item.excerpt && <span className="mt-0.5 block truncate text-15 text-ink-2">{frenchTypo(item.excerpt)}</span>}
        </span>
        <Icon name="chevron-droite" size={18} className="shrink-0 text-ink-3" />
      </NextLink>
    </li>
  );
};

/** Carte qui regroupe des rangées d'annonces. */
export const AnnouncementList = ({ items, className }: { items: AnnouncementSummary[]; className?: string }) => (
  <ul className={cn('m-0 list-none overflow-hidden rounded-16 border border-line bg-paper p-0 shadow-card', className)}>
    {items.map((item, index) => (
      <AnnouncementRow key={item.id} item={item} first={index === 0} />
    ))}
  </ul>
);
