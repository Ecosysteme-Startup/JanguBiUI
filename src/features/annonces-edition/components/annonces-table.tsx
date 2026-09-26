'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import type * as React from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeTone, Tag } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { paths } from '@/config/paths';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import type { ArticleStatus, StaffArticle } from '../api/staff-article';

export type AnnoncesTab = ArticleStatus | 'all';

const TYPE_LABEL: Record<string, string> = { announcement: 'Annonce', article: 'Article', meditation: 'Méditation' };

const STATUS_BADGE: Record<ArticleStatus, { label: string; tone: BadgeTone }> = {
  published: { label: 'Publiée', tone: 'ok' },
  scheduled: { label: 'Programmée', tone: 'info' },
  draft: { label: 'Brouillon', tone: 'neutral' },
  unpublished: { label: 'Retirée', tone: 'muted' },
};

/** Intitulé de la colonne de date selon l'onglet. */
export const DATE_HEADER: Record<AnnoncesTab, string> = {
  published: 'Publiée le',
  scheduled: 'Programmée pour',
  draft: 'Modifiée le',
  unpublished: 'Retirée le',
  all: 'Date',
};

const dateOf = (a: StaffArticle): string => {
  if (a.status === 'published') return a.published_at ?? a.updated_at;
  if (a.status === 'scheduled') return a.publish_at ?? a.updated_at;
  if (a.status === 'unpublished') return a.unpublished_at ?? a.updated_at;
  return a.updated_at;
};

const TitleCell = ({ nodeId, article, showStatus }: { nodeId: string; article: StaffArticle; showStatus: boolean }) => {
  const badge = STATUS_BADGE[article.status];
  const excerpt = frenchTypo(article.excerpt);
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="flex min-w-0 items-center gap-2">
        {/* Titre complet en infobulle et dans le nom accessible (A11Y-18). */}
        <NextLink
          href={paths.espace.annonces.detail.getHref(nodeId, article.id)}
          title={frenchTypo(article.title)}
          className="truncate text-15 font-semibold text-ink hover:text-primary-strong"
        >
          {frenchTypo(article.title)}
        </NextLink>
        {showStatus && <Badge tone={badge.tone} dot>{badge.label}</Badge>}
      </span>
      <span className="truncate text-13 text-ink-3">
        {article.is_sunday_notice && article.sunday_date && (
          <span className="text-primary">Annonce du dimanche · {dayjs(article.sunday_date).format('DD.MM')}</span>
        )}
        {article.is_sunday_notice && article.sunday_date && excerpt && ' · '}
        {excerpt}
      </span>
    </div>
  );
};

const RowActions = ({ nodeId, article }: { nodeId: string; article: StaffArticle }) => {
  const router = useRouter();
  return (
    <Menu>
      <MenuTrigger
        aria-label={`Actions pour « ${article.title} »`}
        className="hit inline-flex size-9 items-center justify-center rounded-10 text-ink-2 hover:bg-surface-2 data-[state=open]:bg-surface-2"
      >
        <Icon name="plus-horizontal" size={18} />
      </MenuTrigger>
      <MenuContent align="end">
        <MenuItem icon="crayon" onSelect={() => router.push(paths.espace.annonces.detail.getHref(nodeId, article.id))}>
          Modifier
        </MenuItem>
        {article.status === 'published' && (
          <MenuItem icon="oeil" onSelect={() => router.push(paths.app.paroisse.annonce.getHref(article.id))}>
            Voir côté fidèle
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
};

const ArticleRow = ({ nodeId, article, showStatus }: { nodeId: string; article: StaffArticle; showStatus: boolean }) => {
  const when = dayjs(dateOf(article));
  return (
    <Tr>
      <Td className="h-[76px] max-w-0 py-3">
        <TitleCell nodeId={nodeId} article={article} showStatus={showStatus} />
      </Td>
      <Td className="py-3">
        <span className="flex flex-col items-start gap-1">
          <Tag>{article.category?.name ?? TYPE_LABEL[article.content_type] ?? 'Contenu'}</Tag>
          <span className="whitespace-nowrap text-12 text-ink-3">{article.scope.place_name ?? 'Toute la paroisse'}</span>
        </span>
      </Td>
      <Td className="py-3">
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-14 text-ink-2">
          <Avatar name={article.author_name} size={24} />
          {article.author_name}
        </span>
      </Td>
      <Td className="tnum py-3">
        <span className="flex flex-col whitespace-nowrap text-14 text-ink-2">
          <span>{when.format('ddd D MMM')}</span>
          <span className="text-13 text-ink-3">à {when.format('H:mm')}</span>
        </span>
      </Td>
      <Td className="tnum whitespace-nowrap py-3 text-right text-14 font-semibold text-ink">
        {article.status === 'published' ? new Intl.NumberFormat('fr-FR').format(article.reads_count) : '—'}
      </Td>
      <Td className="py-3 text-right">
        <RowActions nodeId={nodeId} article={article} />
      </Td>
    </Tr>
  );
};

/** Tableau des annonces (PAR-Annonces) : titre et chapô, catégorie et lieu, auteur, date, lectures, actions. */
export const AnnoncesTable = ({ nodeId, tab, articles, footer }: {
  nodeId: string;
  tab: AnnoncesTab;
  articles: StaffArticle[];
  footer: React.ReactNode;
}) => (
  <div className="mt-4 overflow-hidden rounded-16 border border-line bg-paper shadow-card">
    <Table className="min-w-[760px] table-fixed" label="Annonces, défilement horizontal">
      <thead>
        <tr>
          <Th className="h-10 border-b-0">Annonce</Th>
          <Th className="h-10 w-[156px] border-b-0">Catégorie et lieu</Th>
          <Th className="h-10 w-[166px] border-b-0">Auteur</Th>
          <Th className="h-10 w-[128px] border-b-0" sort="descending">
            {DATE_HEADER[tab]}
          </Th>
          <Th className="h-10 w-[80px] border-b-0 text-right">Lectures</Th>
          <Th className="h-10 w-[56px] border-b-0">
            <span className="sr-only">Actions</span>
          </Th>
        </tr>
      </thead>
      <tbody className="[&>tr>td]:border-b-0 [&>tr>td]:border-t [&>tr>td]:border-line">
        {articles.map((article) => (
          <ArticleRow key={article.id} nodeId={nodeId} article={article} showStatus={tab === 'all'} />
        ))}
      </tbody>
    </Table>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-14 text-ink-2">{footer}</div>
  </div>
);
