'use client';

import NextLink from 'next/link';
import { useEffect, useRef } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { parishLabel } from '@/utils/parish-name';

import { useAnnouncement, useMarkAnnouncementRead } from '../api/get-announcement';
import { useAnnouncements } from '../api/get-announcements';
import { readingMinutes } from '../utils/article-content';

import { announcementKicker } from './announcements-section';
import { ArticleBody } from './article-body';

const BackLink = () => (
  <NextLink href={paths.app.paroisse.root.getHref('annonces')} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-2 hover:text-primary">
    <Icon name="fleche-gauche" size={16} />
    Retour · Ma paroisse
  </NextLink>
);

const Related = ({ nodeId, currentId }: { nodeId: string; currentId: string }) => {
  const { data } = useAnnouncements(nodeId);
  const others = (data?.results ?? []).filter((a) => a.id !== currentId).slice(0, 3);
  if (others.length === 0) return null;
  return (
    <section aria-labelledby="an-liees">
      <SectionHeading
        id="an-liees"
        title="À lire aussi"
        aside={<NextLink href={paths.app.paroisse.root.getHref('annonces')}>Toutes</NextLink>}
      />
      {others.map((a, i) => (
        <article key={a.id} className="border-b border-line py-4">
          <p className="tnum m-0 text-meta text-ink-3">
            <span className="text-primary">{String(i + 1).padStart(2, '0')}</span> — {announcementKicker(a)}
          </p>
          <h3 className="m-0 mt-1 font-serif text-h4 font-normal">
            <NextLink href={paths.app.paroisse.annonce.getHref(a.id)} className="text-ink hover:text-primary">
              {frenchTypo(a.title)}
            </NextLink>
          </h3>
        </article>
      ))}
    </section>
  );
};

/** Annonce (FID-Annonce) : contenu riche nettoyé, auteur, partage, annonces liées. */
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

  if (isPending) return <LoadingBlock label="Chargement de l’annonce…" lines={6} />;
  if (isError) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <EmptyState tone="err" title={missing ? 'Cette annonce n’existe plus.' : 'L’annonce n’a pas pu être chargée.'}>
          {missing ? 'Elle a peut-être été retirée par la paroisse.' : 'Vérifiez votre connexion puis réessayez.'}
        </EmptyState>
      </div>
    );
  }

  const where = article.scope.place_name ?? article.scope.node_name;
  const share = `https://wa.me/?text=${encodeURIComponent([article.title, article.excerpt, where ? parishLabel(where) : ''].filter(Boolean).join('\n'))}`;

  return (
    <div className="mx-auto max-w-[1180px]">
      <BackLink />
      <div className="mt-6 grid gap-12 lg:grid-cols-12 lg:gap-6">
        <article aria-labelledby="an-titre" className="lg:col-span-8">
          <p className="tnum m-0 flex flex-wrap justify-between gap-2 text-meta text-ink-3">
            <span>
              {article.category?.name ?? 'Annonce'}
              {where && ` — ${parishLabel(where)}`}
            </span>
            {article.published_at && <span>Publiée le {dayjs(article.published_at).format('dddd DD.MM')}</span>}
          </p>
          <h1 id="an-titre" className="m-0 mt-4 font-serif text-title font-normal text-ink lg:text-h2">
            {frenchTypo(article.title)}
          </h1>
          {article.excerpt && <p className="m-0 mt-4 max-w-reading text-lead text-ink-2">{frenchTypo(article.excerpt)}</p>}
          <div className="mt-6 flex items-center justify-between gap-4 border-y border-line py-4">
            <span className="flex items-center gap-3">
              <Avatar name={article.author_name} size={40} />
              <span className="text-base text-ink">{article.author_name}</span>
            </span>
            <span className="tnum text-meta text-ink-3">Lecture · {readingMinutes(article.content)} min</span>
          </div>
          {article.cover_image_url && (
            <figure className="m-0 mt-6">
              {/* URL signée du stockage (MinIO/S3) : pas d'optimisation next/image. */}
              <img src={article.cover_image_url} alt={article.cover_image_decorative ? '' : article.cover_image_alt} className="aspect-[4/1] w-full border border-line object-cover" />
            </figure>
          )}
          <div className="mt-4">
            <ArticleBody content={article.content} format={article.content_format} />
          </div>
        </article>
        <aside className="flex flex-col gap-10 lg:col-span-4">
          <section aria-labelledby="an-partage" className="border border-line bg-surface p-6">
            <p id="an-partage" className="m-0 font-serif text-h4 text-ink">
              Faire connaître cette annonce
            </p>
            <p className="m-0 mt-2 text-sm text-ink-2">Envoyez-en le titre et le résumé à vos proches.</p>
            <a href={share} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'secondary', block: true, className: 'mt-4' })}>
              Partager sur WhatsApp
            </a>
          </section>
          {article.scope.node_id && <Related nodeId={article.scope.node_id} currentId={article.id} />}
        </aside>
      </div>
    </div>
  );
};
