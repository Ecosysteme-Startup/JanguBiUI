import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { components } from '@/types/api';

export type Book = components['schemas']['BookMetadataOutput'];

export type BookList = Book[];

export type GetBooksOptions = {
  testament?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
};

// GET /v1/bible/books/?testament=<slug>&search=… — LimitOffsetPagination
// plafonnée à 50 par page (apps/api/pagination.py) : la Bible compte
// 73 livres, on suit donc les pages jusqu'au bout.
const PAGE_MAX = 50;

type BooksPage = { count: number; next: string | null; results: BookList };

export const getBooks = async (
  options: GetBooksOptions = {},
): Promise<BookList> => {
  const { limit = PAGE_MAX, offset = 0, testament, search } = options;
  const livres: BookList = [];
  let courant = offset;
  for (;;) {
    const res = await api.get<BooksPage | BookList>('/v1/bible/books/', {
      params: {
        testament: testament || undefined,
        search: search || undefined,
        limit,
        offset: courant,
      },
    });
    if (Array.isArray(res)) return res;
    livres.push(...res.results);
    if (!res.next || res.results.length === 0 || livres.length >= res.count)
      return livres;
    courant += res.results.length;
  }
};

export const getBooksQueryOptions = (options?: GetBooksOptions) => {
  return queryOptions({
    queryKey: ['books', options],
    queryFn: () => getBooks(options),
  });
};

export const useBooks = (options?: GetBooksOptions) =>
  useQuery(getBooksQueryOptions(options));
