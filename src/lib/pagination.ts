import { z } from 'zod';

/**
 * Page du backend V1 (LimitOffsetPagination) :
 * `{limit, offset, count, next, previous, results}`.
 * `limit`/`offset` absents dans quelques anciens mocks → valeurs par défaut.
 */
export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    limit: z.number().default(0),
    offset: z.number().default(0),
    count: z.number(),
    next: z.string().nullable().default(null),
    previous: z.string().nullable().default(null),
    results: z.array(item),
  });

export type Paginated<T> = {
  limit: number;
  offset: number;
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** Construit une page (mocks et tests) au format exact du backend. */
export const page = <T>(
  results: T[],
  {
    limit = 20,
    offset = 0,
    count,
  }: { limit?: number; offset?: number; count?: number } = {},
): Paginated<T> => {
  const total = count ?? results.length;
  return {
    limit,
    offset,
    count: total,
    next:
      offset + results.length < total
        ? `?limit=${limit}&offset=${offset + limit}`
        : null,
    previous:
      offset > 0
        ? `?limit=${limit}&offset=${Math.max(0, offset - limit)}`
        : null,
    results,
  };
};
