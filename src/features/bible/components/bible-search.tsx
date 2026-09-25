'use client';

import NextLink from 'next/link';
import { useId, useState } from 'react';

import { Input } from '@/components/ui/input';
import { paths } from '@/config/paths';
import { SEARCH_MIN_LENGTH, useSearchBible } from '@/features/bible/api/search-bible';
import { useDebounce } from '@/hooks/use-debounce';
import { ApiError } from '@/lib/api-client';
import { frenchTypo } from '@/utils/french-typo';

/** Recherche plein texte dans la Bible (`/bible/search/`), à partir de trois lettres. */
export const BibleSearch = ({ className }: { className?: string }) => {
  const id = useId();
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 300);
  const search = useSearchBible(debounced);
  const active = debounced.trim().length >= SEARCH_MIN_LENGTH;
  const count = search.data?.reduce((n, g) => n + g.matches.length, 0) ?? 0;

  return (
    <div className={className} role="search">
      <label htmlFor={id} className="sr-only">
        Rechercher dans la Bible
      </label>
      <Input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un mot, ex. « vanité »" className="h-11" />
      <div aria-live="polite" className="mt-2">
        {active && search.isError && (
          <p className="m-0 text-sm text-err">
            {search.error instanceof ApiError ? search.error.message : 'La recherche ne répond pas. Réessayez.'}
          </p>
        )}
        {active && search.isSuccess && (
          <p className="tnum m-0 text-meta text-ink-3">
            {count === 0 ? 'Aucun verset trouvé.' : `${count} verset${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`}
          </p>
        )}
      </div>
      {active && count > 0 && (
        <ul aria-label="Résultats de la recherche" className="m-0 mt-2 max-h-80 list-none overflow-y-auto border-t border-line p-0">
          {search.data?.flatMap((group) =>
            group.matches.map(({ verse }) => (
              <li key={verse.id}>
                <NextLink
                  href={`${paths.app.bible.chapitre.getHref(group.book.slug, verse.chapter.number)}#v${verse.number}`}
                  className="block border-b border-line px-2 py-3 transition-colors hover:bg-surface-2"
                >
                  <span className="tnum block text-meta text-primary">
                    {group.book.name} {verse.chapter.number}, {verse.number}
                  </span>
                  <span className="mt-1 block font-serif text-base text-ink">{frenchTypo(verse.text)}</span>
                </NextLink>
              </li>
            )),
          )}
        </ul>
      )}
    </div>
  );
};
