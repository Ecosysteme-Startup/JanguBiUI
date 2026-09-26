'use client';

import NextLink from 'next/link';
import { useEffect, useRef } from 'react';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Avatar } from '@/components/ui/avatar';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { parishLabel } from '@/utils/parish-name';

import { useAnnouncement, useMarkAnnouncementRead } from '../api/get-announcement';
import { useAnnouncements } from '../api/get-announcements';
import { readingMinutes } from '../utils/article-content';

import { announcementKicker } from './announcement-row';
import { ArticleBody } from './article-body';
import { BackLink } from './back-link';
import { SecretariatQuestion } from './secretariat-question';
import { ShareButton, ShareIconButton } from './share-button';

const ALL = paths.app.paroisse.root.getHref('annonces');

const Crumbs = ({ title }: { title?: string }) => (
  <TopbarContent
    start={
      <Breadcrumbs
        items={[
          { label: 'Ma paroisse', href: paths.app.paroisse.root.getHref() },
          { label: 'Annonces', href: ALL },
          ...(title ? [{ label: title }] : []),
        ]}
      />
    }
  />
);

/** Annonces liées : les trois dernières autres annonces de la même paroisse. */
const Related = ({ nodeId, currentId }: { nodeId: string; currentId: string }) => {
  const { data } = useAnnouncements(nodeId);
  const others = (data?.results ?? []).filter((a) => a.id !== currentId).slice(0, 3);
  if (others.length === 0) return null;
  return (
    <section aria-labelledby="an-liees">
      <h2 id="an-liees" className="m-0 text-18 font-semibold text-ink">
        Annonces liées
      </h2>
      <ul className="m-0 mt-3 list-none overflow-hidden rounded-16 border border-line bg-paper p-0 shadow-card">
        {others.map((a, i) => (
          <li key={a.id} className={cn(i < others.length - 1 && 'border-b border-line')}>
            <NextLink href={paths.app.paroisse.annonce.getHref(a.id)} className="block px-4 py-3.5 text-ink hover:bg-surface hover:text-ink hover:no-underline">
              <span className="tnum block text-13 text-ink-3">{announcementKicker(a)}</span>
              <span className="mt-0.5 block text-15 font-semibold">{frenchTypo(a.title)}</span>
              {a.excerpt && <span className="mt-0.5 line-clamp-2 block text-14 text-ink-2">{frenchTypo(a.excerpt)}</span>}
            </NextLink>
          </li>
        ))}
      </ul>
    </section>
  );
};

/** Annonce (FID-Annonce) : contenu riche nettoyé, auteur, partage, annonces liées, question au secrétariat. */
export const AnnouncementView = ({ id }: { id: string }) => {
  const { data: article, isPending, isError, error } = useAnnouncement(id);
  const { mutate: markRead } = useMarkAnnouncementRead();
  const marked = useRef(false);

  useEffect(() => {
    if (article && !marked.current) {
      marked.current = true;
      markRead(article.id);
    }
  }, [article, markRead]);

  if (isPending)
    return (
      <>
        <Crumbs />
        <LoadingBlock label="Chargement de l’annonce…" lines={6} />
      </>
    );
  if (isError) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col gap-6">
        <Crumbs />
        <BackLink href={ALL}>Toutes les annonces</BackLink>
        <EmptyState tone="err" title={missing ? 'Cette annonce n’existe plus.' : 'L’annonce n’a pas pu être chargée.'}>
          {missing ? 'Elle a peut-être été retirée par la paroisse.' : 'Vérifiez votre connexion puis réessayez.'}
        </EmptyState>
      </div>
    );
  }

  const where = article.scope.place_name ?? article.scope.node_name;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent([article.title, article.excerpt, where ? parishLabel(where) : ''].filter(Boolean).join('\n'))}`;
  const published = article.published_at ? `Publiée le ${dayjs(article.published_at).format('dddd D MMMM YYYY')}` : null;

  return (
    <div>
      <Crumbs title={article.title} />
      <BackLink href={ALL}>Toutes les annonces</BackLink>
      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[minmax(0,680px)_minmax(0,1fr)]">
        <article aria-labelledby="an-titre" className="min-w-0">
          <p className="m-0 flex flex-wrap items-center gap-3">
            <span className="inline-flex h-[26px] items-center rounded-full bg-tint-50 px-2.5 text-13 font-medium text-tint-800">
              {article.category?.name ?? 'Annonce'}
            </span>
            {article.is_sunday_notice && (
              <span className="inline-flex items-center gap-1 text-13 text-ink-3">
                <Icon name="calendrier" size={14} />
                Annonce du dimanche{article.sunday_date ? ` ${dayjs(article.sunday_date).format('D MMMM')}` : ''}
              </span>
            )}
          </p>
          <h1 id="an-titre" className="m-0 mt-3 text-28 font-semibold text-ink sm:text-32">
            {frenchTypo(article.title)}
          </h1>
          <div className="mt-5 flex items-center justify-between gap-4 border-b border-line pb-5">
            <span className="flex min-w-0 items-center gap-3">
              <Avatar name={article.author_name} size={40} className="text-14" />
              <span className="flex min-w-0 flex-col">
                <span className="text-15 font-semibold text-ink">{article.author_name}</span>
                <span className="tnum text-13 text-ink-3">
                  {[published, where ? parishLabel(where) : null, `${readingMinutes(article.content)} min de lecture`].filter(Boolean).join(' · ')}
                </span>
              </span>
            </span>
            <ShareIconButton title={article.title} label="Partager l’annonce" />
          </div>
          {article.cover_image_url && (
            <figure className="m-0 mt-6">
              {/* URL signée du stockage (MinIO/S3) : pas d'optimisation next/image. */}
              <img
                src={article.cover_image_url}
                alt={article.cover_image_decorative ? '' : article.cover_image_alt}
                className="aspect-[2/1] w-full rounded-16 object-cover"
              />
            </figure>
          )}
          <div className="mt-6">
            <ArticleBody content={article.content} format={article.content_format} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ShareButton title={article.title} label="Partager l’annonce" />
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: 'outline' }), 'h-11 hover:no-underline')}>
              <Icon name="message" size={18} />
              WhatsApp
              <span className="sr-only"> (nouvel onglet)</span>
            </a>
            {article.is_sunday_notice && <span className="text-14 text-ink-3">Elle sera aussi lue à la fin des messes de ce week-end.</span>}
          </div>
        </article>
        <aside aria-label="Autour de cette annonce" className="flex min-w-0 flex-col gap-6">
          {article.scope.node_id && <Related nodeId={article.scope.node_id} currentId={article.id} />}
          {article.scope.node_id && <SecretariatQuestion nodeId={article.scope.node_id} title="Une question sur cette annonce ?" />}
        </aside>
      </div>
    </div>
  );
};
