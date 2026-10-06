'use client';

import NextLink from 'next/link';
import { useId, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { paths } from '@/config/paths';
import type { Book, Testament } from '@/features/bible/api/get-testaments';
import { BibleSearchResults } from '@/features/bible/components/bible-search';
import { bookGroups, filterBooks, parseReference } from '@/features/bible/utils/bible';
import { cn } from '@/utils/cn';

/**
 * Panneau des livres (FID-Bible) : recherche d'un livre ou d'un passage, testament, livres groupés.
 * Défilement interne seulement en lg : sur mobile la liste suit la page (A11Y-17).
 */
export const BookPanel = ({ testaments, current }: { testaments: Testament[]; current?: Book }) => {
  const id = useId();
  const sorted = [...testaments].sort((a, b) => a.order - b.order);
  const [testament, setTestament] = useState(current?.testament ?? sorted.find((t) => t.slug === 'nouveau')?.slug ?? sorted[0]?.slug ?? '');
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;
  const allBooks = sorted.flatMap((t) => t.books);
  // Référence saisie (« Jn 3, 16 », « Jean 3 ») : on ouvre le livre au bon chapitre (et verset).
  const reference = searching ? parseReference(query, allBooks) : undefined;
  const books = reference
    ? [reference.book]
    : searching
      ? sorted.flatMap((t) => filterBooks(t.books, query))
      : (sorted.find((t) => t.slug === testament)?.books ?? []);
  const groups = searching ? [{ label: null, books }] : bookGroups(books);
  const hrefOfBook = (b: Book) =>
    reference && b.id === reference.book.id
      ? `${paths.app.bible.chapitre.getHref(b.slug, reference.chapter)}${reference.verse ? `#v${reference.verse}` : ''}`
      : paths.app.bible.chapitre.getHref(b.slug, 1);

  return (
    <nav aria-label="Livres de la Bible" className="flex min-w-0 flex-col rounded-16 border border-line bg-surface p-4">
      <div role="search" className="flex min-h-11 items-center gap-2 rounded-12 border border-line-field bg-paper px-3 text-ink-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
        <Icon name="recherche" size={18} className="shrink-0" />
        <label htmlFor={id} className="sr-only">
          Rechercher un livre ou un passage
        </label>
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Livre ou passage"
          className="min-w-0 flex-1 border-0 bg-transparent text-15 text-ink outline-none placeholder:text-ink-3"
        />
      </div>
      {!searching && (
        <SegmentedControl
          label="Testament"
          value={testament}
          onChange={setTestament}
          options={sorted.map((t) => [t.slug, t.name.replace(/ Testament$/, '')] as const)}
          size="xs"
          block
          className="mt-3"
        />
      )}
      <div className="mt-3 lg:max-h-[640px] lg:overflow-y-auto lg:pr-2.5">
        {groups.map((group, gi) => (
          <ul key={group.label ?? `g${gi}`} aria-label={group.label ?? undefined} className={cn('m-0 list-none p-0', gi > 0 && 'mt-2 border-t border-line pt-2')}>
            {group.label && (
              <li aria-hidden="true" className="px-3 pb-1 pt-2 text-13 text-ink-3">
                {group.label}
              </li>
            )}
            {group.books.map((b) => {
              const active = current?.id === b.id;
              return (
                <li key={b.id}>
                  <NextLink
                    href={hrefOfBook(b)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-10 items-center justify-between gap-3 rounded-10 px-3 text-15 transition-colors',
                      active ? 'bg-tint-100 font-semibold text-tint-800 hover:text-tint-800' : 'text-ink hover:bg-paper hover:text-ink',
                    )}
                  >
                    <span className="min-w-0">{b.name}</span>
                    <span className={cn('tnum text-13', !active && 'text-ink-3')}>{b.chapter_count}</span>
                  </NextLink>
                </li>
              );
            })}
          </ul>
        ))}
        {searching && books.length === 0 && <p className="m-0 px-3 py-2 text-14 text-ink-3">Aucun livre de ce nom.</p>}
        <BibleSearchResults query={query} />
      </div>
    </nav>
  );
};
