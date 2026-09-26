'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useChapterVerses } from '@/features/bible/api/get-chapter-verses';
import { type Book, type Testament, useTestaments } from '@/features/bible/api/get-testaments';
import { BIBLE_EDITION, BibleShell } from '@/features/bible/components/bible-shell';
import { BookPanel } from '@/features/bible/components/book-panel';
import { ChapterText, type Passage } from '@/features/bible/components/chapter-text';
import { type TextSize, TextSizeButton } from '@/features/bible/components/text-size-button';
import { chapterShortName, chapterTitle, findBook, neighbours, testamentOf } from '@/features/bible/utils/bible';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';

const errorText = (error: unknown) => (error instanceof ApiError ? error.message : 'Le service ne répond pas. Réessayez dans un instant.');

const ChapterGrid = ({ book, chapter }: { book: Book; chapter: number }) => (
  <div role="group" aria-label={`Chapitres : ${book.name}`} className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-8 xl:grid-cols-12">
    {Array.from({ length: book.chapter_count }, (_, i) => i + 1).map((n) => (
      <NextLink
        key={n}
        href={paths.app.bible.chapitre.getHref(book.slug, n)}
        aria-current={n === chapter ? 'page' : undefined}
        className={cn(
          'tnum flex h-10 items-center justify-center rounded-10 border text-15 transition-colors',
          n === chapter
            ? 'border-primary-fill bg-primary-fill font-semibold text-on-primary hover:text-on-primary'
            : 'border-line font-medium text-ink hover:border-line-active hover:text-ink',
        )}
      >
        {n}
      </NextLink>
    ))}
  </div>
);

const ChapterArticle = ({ testaments, book, chapter, passage }: { testaments: Testament[]; book: Book; chapter: number; passage?: Passage }) => {
  const verses = useChapterVerses(book.id, chapter);
  const [size, setSize] = useState<TextSize>('normal');
  const { prev, next } = neighbours(testaments, book, chapter);
  const testament = testamentOf(testaments, book);
  const count = verses.data?.length ?? 0;
  return (
    <article aria-labelledby="bible-titre" aria-describedby="bible-versets">
      <div className="flex flex-wrap-reverse items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 flex-1 basis-60">
          {testament && <p className="m-0 text-14 text-ink-3">{testament.name}</p>}
          <h2 id="bible-titre" className="m-0 mt-1 text-24 font-semibold text-ink">
            {chapterTitle(book, chapter)}
          </h2>
          <p id="bible-versets" className="sr-only">
            {book.name} {chapter}
            {count > 0 && ` · versets 1-${verses.data?.[count - 1]?.number ?? count}`}
          </p>
        </div>
        <TextSizeButton value={size} onChange={setSize} />
      </div>
      <ChapterGrid book={book} chapter={chapter} />
      {verses.isPending ? (
        <div className="mt-8 max-w-parole">
          <LoadingBlock label="Chargement du chapitre…" lines={8} />
        </div>
      ) : verses.isError ? (
        <EmptyState
          tone="err"
          title="Impossible d’afficher ce chapitre."
          className="mt-8"
          action={
            <Button variant="outline" onClick={() => verses.refetch()}>
              Réessayer
            </Button>
          }
        >
          <p className="m-0">{errorText(verses.error)}</p>
        </EmptyState>
      ) : count === 0 ? (
        <EmptyState title="Le texte de ce chapitre n’est pas encore disponible." className="mt-8" />
      ) : (
        <ChapterText verses={verses.data} reference={(n) => `${book.name} ${chapter}, ${n}`} size={size} passage={passage} />
      )}
      <nav aria-label="Chapitres voisins" className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5">
        {prev ? (
          <NextLink
            href={paths.app.bible.chapitre.getHref(prev.book.slug, prev.chapter)}
            className={cn(buttonVariants({ variant: 'outline', className: 'min-h-11 pl-3' }))}
          >
            <Icon name="chevron-gauche" size={18} />
            {chapterShortName(prev.book, prev.chapter)}
          </NextLink>
        ) : (
          <span />
        )}
        <span className="hidden text-13 text-ink-3 sm:inline">{BIBLE_EDITION}</span>
        {next ? (
          <NextLink
            href={paths.app.bible.chapitre.getHref(next.book.slug, next.chapter)}
            className={cn(buttonVariants({ variant: 'outline', className: 'min-h-11 pr-3' }))}
          >
            {chapterShortName(next.book, next.chapter)}
            <Icon name="chevron-droite" size={18} />
          </NextLink>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
};

/** Lecture d'un chapitre (FID-Bible) : panneau des livres, chapitres, texte, chapitres voisins. */
export const ChapterReader = ({ livre, chapitre, passage }: { livre: string; chapitre: number; passage?: Passage }) => {
  const testaments = useTestaments();
  const book = testaments.data ? findBook(testaments.data, livre) : undefined;
  const validChapter = book && Number.isInteger(chapitre) && chapitre >= 1 && chapitre <= book.chapter_count;

  if (testaments.isPending) {
    return (
      <BibleShell panel={null}>
        <LoadingBlock label="Chargement de la Bible…" lines={6} />
      </BibleShell>
    );
  }
  if (testaments.isError) {
    return (
      <BibleShell panel={null}>
        <EmptyState
          tone="err"
          title="Impossible d’ouvrir la Bible."
          action={
            <Button variant="outline" onClick={() => testaments.refetch()}>
              Réessayer
            </Button>
          }
        >
          <p className="m-0">{errorText(testaments.error)}</p>
        </EmptyState>
      </BibleShell>
    );
  }
  return (
    <BibleShell panel={<BookPanel testaments={testaments.data} current={book} />}>
      {!book || !validChapter ? (
        <EmptyState
          title={book ? `${book.name} n’a pas de chapitre ${chapitre}.` : 'Ce livre est introuvable.'}
          action={
            <Button asChild variant="outline">
              <NextLink href={book ? paths.app.bible.chapitre.getHref(book.slug, 1) : paths.app.bible.root.getHref()}>
                {book ? `Ouvrir ${book.name}, chapitre 1` : 'Choisir un livre'}
              </NextLink>
            </Button>
          }
        />
      ) : (
        <ChapterArticle key={`${book.id}-${chapitre}`} testaments={testaments.data} book={book} chapter={chapitre} passage={passage} />
      )}
    </BibleShell>
  );
};
