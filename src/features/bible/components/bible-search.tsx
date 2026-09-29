'use client';

import NextLink from 'next/link';

import { paths } from '@/config/paths';
import { SEARCH_MIN_LENGTH, useSearchBible } from '@/features/bible/api/search-bible';
import { useDebounce } from '@/hooks/use-debounce';
import { ApiError } from '@/lib/api-client';
import { frenchTypo } from '@/utils/french-typo';

/** Versets contenant la saisie (`/bible/search/`), à partir de trois lettres. */
export const BibleSearchResults = ({ query }: { query: string }) => {
  const debounced = useDebounce(query, 300);
  const search = useSearchBible(debounced);
  const active = debounced.trim().length >= SEARCH_MIN_LENGTH;
  const count = search.data?.reduce((n, g) => n + g.matches.length, 0) ?? 0;
  if (!active) return null;

  return (
    <div className="mt-2 border-t border-line pt-3">
      <p aria-live="polite" className="tnum m-0 px-3 text-13 text-ink-3">
        {search.isError
          ? search.error instanceof ApiError
            ? search.error.message
            : 'La recherche ne répond pas. Réessayez.'
          : search.isSuccess
            ? count === 0
              ? 'Aucun verset trouvé.'
              : `${count} verset${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`
            : 'Recherche dans le texte…'}
      </p>
      {count > 0 && (
        <ul aria-label="Résultats de la recherche" className="m-0 mt-1 list-none p-0">
          {search.data?.flatMap((group) =>
            group.matches.map(({ verse }) => (
              <li key={verse.id}>
                <NextLink
                  href={`${paths.app.bible.chapitre.getHref(group.book.slug, verse.chapter.number)}#v${verse.number}`}
                  className="block rounded-10 px-3 py-2 text-ink transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <span className="tnum block text-13 font-semibold text-primary">
                    {group.book.name} {verse.chapter.number}, {verse.number}
                  </span>
                  <span className="mt-0.5 line-clamp-3 block font-serif text-15">{frenchTypo(verse.text)}</span>
                </NextLink>
              </li>
            )),
          )}
        </ul>
      )}
    </div>
  );
};
