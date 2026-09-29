'use client';

import NextLink from 'next/link';

import { cardClasses } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { SkeletonLine } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type HomeAnnouncement, HOME_ANNOUNCEMENTS, useAnnouncements } from '../api/get-announcements';

import { HomeSection } from './home-section';

const rowClass = 'flex items-center gap-4 px-6 py-4';

const AnnouncementRow = ({ item }: { item: HomeAnnouncement }) => {
  const meta = [item.category?.name, item.published_at && dayjs(item.published_at).format('ddd D MMM')].filter(Boolean).join(' · ');
  return (
    <li className="border-b border-line last:border-b-0">
      <NextLink href={paths.app.paroisse.annonce.getHref(item.id)} className={cn(rowClass, 'text-ink transition-colors hover:bg-surface hover:text-ink')}>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5 text-13 text-ink-3">
            {item.is_sunday_notice && (
              <>
                <Icon name="epingle" size={14} className="text-primary" />
                <span className="font-medium text-primary">Annonce du dimanche</span>
                {meta && <span aria-hidden="true">·</span>}
              </>
            )}
            <span>{meta}</span>
          </span>
          <span className="mt-1 block text-16 font-semibold">{frenchTypo(item.title)}</span>
          {item.excerpt && <span className="mt-0.5 block truncate text-15 text-ink-2">{frenchTypo(item.excerpt)}</span>}
        </span>
        <Icon name="chevron-droite" size={18} className="shrink-0 text-ink-3" />
      </NextLink>
    </li>
  );
};

/** « Dernières annonces » (FID-Accueil) : les trois dernières annonces de la paroisse suivie. */
export const LatestAnnouncements = ({ className }: { className?: string }) => {
  const { data: me } = useMe();
  const nodeId = me?.paroisse_suivie?.id ?? null;
  const { data, isPending, isError } = useAnnouncements(nodeId);
  if (me && !nodeId) return null;
  const items = data?.results.slice(0, HOME_ANNOUNCEMENTS) ?? [];

  return (
    <HomeSection
      id="acc-annonces"
      title="Dernières annonces"
      className={className}
      action={<NextLink href={paths.app.paroisse.root.getHref('annonces')}>Toutes les annonces</NextLink>}
    >
      {!me || isPending ? (
        <div role="status" data-testid="annonces-squelette" className={cardClasses({ padding: 'none' })}>
          <span className="sr-only">Chargement des annonces…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} aria-hidden="true" className={cn(rowClass, 'block border-b border-line last:border-b-0')}>
              <SkeletonLine className="text-13" width="w-40" />
              <SkeletonLine className="mt-1 text-16" width="w-3/4" />
              <SkeletonLine className="mt-0.5 text-15" width="w-2/3" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="m-0 text-15 text-ink-2">Les annonces n’ont pas pu être chargées.</p>
      ) : items.length === 0 ? (
        <p className="m-0 text-15 text-ink-2">Aucune annonce publiée pour le moment.</p>
      ) : (
        <ul className={cn(cardClasses({ padding: 'none' }), 'm-0 list-none overflow-hidden p-0')}>
          {items.map((item) => (
            <AnnouncementRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </HomeSection>
  );
};
