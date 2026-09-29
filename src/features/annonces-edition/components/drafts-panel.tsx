'use client';

import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { useStaffNews } from '../api/get-staff-news';
import type { StaffArticle } from '../api/staff-article';

const actionClass = cn(buttonVariants({ variant: 'outline', size: 'md' }), 'text-14 hover:no-underline');

const Cell = ({ title, href, meta, action, actionLabel, actionHref, className }: {
  title: string;
  actionLabel?: string;
  href: string;
  meta: string;
  action: string;
  actionHref: string;
  className?: string;
}) => (
  <div className={cn('flex min-w-0 items-center gap-4 px-5 py-4', className)}>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <NextLink href={href} className="truncate text-15 font-semibold text-ink hover:text-primary-strong">
        {frenchTypo(title)}
      </NextLink>
      <span className="text-13 text-ink-3">{meta}</span>
    </div>
    <NextLink href={actionHref} className={actionClass} aria-label={actionLabel}>
      {action}
    </NextLink>
  </div>
);

const draftMeta = (a: StaffArticle) => `Brouillon de ${a.author_name} · modifié ${dayjs(a.updated_at).fromNow()}`;

/**
 * « À terminer avant dimanche » (PAR-Annonces) : le brouillon le plus récent et la feuille
 * d'annonces du dimanche à venir, chacun avec son action.
 */
export const DraftsPanel = ({ nodeId, sunday, draftCount, onShowDrafts }: {
  nodeId: string;
  sunday: string;
  draftCount?: number;
  onShowDrafts: () => void;
}) => {
  const drafts = useStaffNews(nodeId, { status: 'draft', limit: 1, offset: 0 });
  const latest = drafts.data?.results[0];
  const sheetTitle = `Feuille d’annonces du ${dayjs(sunday).format('D MMMM')}`;
  const sheetHref = paths.espace.annonces.feuille.getHref(nodeId, sunday);

  return (
    <section aria-labelledby="annonces-a-terminer" className="mt-6 overflow-hidden rounded-16 border border-line bg-paper shadow-card">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h2 id="annonces-a-terminer" className="m-0 text-16 font-semibold text-ink">
            À terminer avant dimanche
          </h2>
          {draftCount !== undefined && draftCount > 0 && (
            <span className="tnum inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-warn-bg px-1.5 text-12 font-semibold text-warn">
              <span aria-hidden="true">{draftCount}</span>
              <span className="sr-only">{draftCount > 1 ? `${draftCount} brouillons` : '1 brouillon'}</span>
            </span>
          )}
        </div>
        {draftCount !== undefined && draftCount > 0 && (
          <button type="button" onClick={onShowDrafts} className="hit text-14 font-semibold text-primary hover:text-primary-strong hover:underline">
            Voir les brouillons
          </button>
        )}
      </div>
      <div className={cn('grid', latest && 'md:grid-cols-2')}>
        {latest && (
          <Cell
            title={latest.title}
            href={paths.espace.annonces.detail.getHref(nodeId, latest.id)}
            meta={draftMeta(latest)}
            action="Reprendre"
            actionLabel={`Reprendre le brouillon : ${latest.title}`}
            actionHref={paths.espace.annonces.detail.getHref(nodeId, latest.id)}
            className="border-b border-line md:border-b-0 md:border-r"
          />
        )}
        <Cell
          title={sheetTitle}
          href={sheetHref}
          meta="Les annonces du dimanche réunies, prêtes à lire en fin de messe"
          action="Ouvrir la feuille"
          actionHref={sheetHref}
        />
      </div>
    </section>
  );
};
