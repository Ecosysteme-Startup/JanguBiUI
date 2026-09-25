'use client';

import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useChapterVerses } from '@/features/bible/api/get-chapter-verses';
import { type Book, type Testament, useTestaments } from '@/features/bible/api/get-testaments';
import { BibleSearch } from '@/features/bible/components/bible-search';
import { BookNav } from '@/features/bible/components/book-nav';
import { ChapterText } from '@/features/bible/components/chapter-text';
import { findBook, neighbours, testamentOf } from '@/features/bible/utils/bible';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';

const errorText = (error: unknown) => (error instanceof ApiError ? error.message : 'Le service ne répond pas. Réessayez dans un instant.');

const ChapterGrid = ({ book, chapter }: { book: Book; chapter: number }) => (
  <div>
    <p className="tnum m-0 border-t border-line-strong pt-3 text-meta text-ink-2">Chapitres</p>
    <div role="group" aria-label={`Chapitres : ${book.name}`} className="mt-4 grid max-h-[50vh] grid-cols-5 gap-2 overflow-y-auto lg:grid-cols-3">
      {Array.from({ length: book.chapter_count }, (_, i) => i + 1).map((n) => (
        <NextLink
          key={n}
          href={paths.app.bible.chapitre.getHref(book.slug, n)}
          aria-current={n === chapter ? 'page' : undefined}
          className={cn(
            'tnum flex h-11 items-center justify-center rounded border text-base transition-colors',
            n === chapter ? 'border-ink bg-ink text-paper' : 'border-line text-ink hover:bg-surface-2',
          )}
        >
          {n}
        </NextLink>
      ))}
    </div>
  </div>
);

const ChapterArticle = ({ testaments, book, chapter }: { testaments: Testament[]; book: Book; chapter: number }) => {
  const verses = useChapterVerses(book.id, chapter);
  const { prev, next } = neighbours(testaments, book, chapter);
  const titleId = 'bible-texte';
  const count = verses.data?.length ?? 0;
  return (
    <article aria-labelledby={titleId}>
      <p className="tnum m-0 flex items-baseline justify-between gap-4 border-t border-line-strong pt-3 text-meta text-ink-2">
        <span id={titleId}>
          {book.name} {chapter}
          {count > 0 && ` · versets 1-${verses.data?.[count - 1]?.number ?? count}`}
        </span>
      </p>
      {verses.isPending ? (
        <div className="mt-6 max-w-reading">
          <LoadingBlock label="Chargement du chapitre…" lines={8} />
        </div>
      ) : verses.isError ? (
        <EmptyState
          tone="err"
          title="Impossible d’afficher ce chapitre."
          className="mt-6"
          action={
            <Button variant="secondary" onClick={() => verses.refetch()}>
              Réessayer
            </Button>
          }
        >
          <p className="m-0">{errorText(verses.error)}</p>
        </EmptyState>
      ) : count === 0 ? (
        <EmptyState title="Le texte de ce chapitre n’est pas encore disponible." className="mt-6" />
      ) : (
        <ChapterText verses={verses.data} reference={(n) => `${book.name} ${chapter}, ${n}`} />
      )}
      <nav aria-label="Chapitres voisins" className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-4">
        {prev ? (
          <NextLink
            href={paths.app.bible.chapitre.getHref(prev.book.slug, prev.chapter)}
            className="inline-flex h-11 items-center gap-2 text-base font-medium text-primary hover:text-primary-strong"
          >
            <Icon name="fleche-gauche" size={16} />
            {prev.book.name} {prev.chapter}
          </NextLink>
        ) : (
          <span />
        )}
        {next && (
          <NextLink
            href={paths.app.bible.chapitre.getHref(next.book.slug, next.chapter)}
            className="inline-flex h-11 items-center gap-2 text-base font-medium text-primary hover:text-primary-strong"
          >
            {next.book.name} {next.chapter}
            <Icon name="fleche-droite" size={16} />
          </NextLink>
        )}
      </nav>
    </article>
  );
};

/** Lecture d'un chapitre (FID-Bible) : livres, chapitres, texte, chapitres voisins. */
export const ChapterReader = ({ livre, chapitre }: { livre: string; chapitre: number }) => {
  const testaments = useTestaments();
  const book = testaments.data ? findBook(testaments.data, livre) : undefined;
  const validChapter = book && Number.isInteger(chapitre) && chapitre >= 1 && chapitre <= book.chapter_count;
  const testament = book && testaments.data ? testamentOf(testaments.data, book) : undefined;

  return (
    <div className="mx-auto max-w-[1200px]">
      <NextLink
        href={paths.app.parole.getHref()}
        className="mb-6 inline-flex h-8 items-center gap-2 text-sm font-medium text-primary hover:text-primary-strong"
      >
        <Icon name="fleche-gauche" size={16} />
        Retour · Lectures du jour
      </NextLink>

      {testaments.isPending ? (
        <LoadingBlock label="Chargement de la Bible…" lines={6} />
      ) : testaments.isError ? (
        <EmptyState
          tone="err"
          title="Impossible d’ouvrir la Bible."
          action={
            <Button variant="secondary" onClick={() => testaments.refetch()}>
              Réessayer
            </Button>
          }
        >
          <p className="m-0">{errorText(testaments.error)}</p>
        </EmptyState>
      ) : !book || !validChapter ? (
        <EmptyState
          title={book ? `${book.name} n’a pas de chapitre ${chapitre}.` : 'Ce livre est introuvable.'}
          action={
            <Button asChild variant="secondary">
              <NextLink href={book ? paths.app.bible.chapitre.getHref(book.slug, 1) : paths.app.bible.root.getHref()}>
                {book ? `Ouvrir ${book.name}, chapitre 1` : 'Choisir un livre'}
              </NextLink>
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="tnum m-0 text-meta text-ink-2">
                <span className="text-primary">01</span> — La Bible{testament && ` · ${testament.name}`}
              </p>
              <h1 className="m-0 mt-3 font-serif text-[36px] font-normal leading-none tracking-[-0.015em] text-ink lg:text-[50px]">
                {book.name}, <em className="italic text-primary">chapitre {chapitre}</em>
              </h1>
            </div>
            <BibleSearch className="w-full lg:w-[360px]" />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
            <BookNav testaments={testaments.data} current={book} className="order-3 lg:order-none lg:col-span-3" />
            <div className="order-2 lg:order-none lg:col-span-2">
              <ChapterGrid book={book} chapter={chapitre} />
            </div>
            <div className="order-1 lg:order-none lg:col-span-7">
              <ChapterArticle key={`${book.id}-${chapitre}`} testaments={testaments.data} book={book} chapter={chapitre} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
