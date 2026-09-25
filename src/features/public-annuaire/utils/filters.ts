import type { DirectoryParams } from '../api/get-directory';

export const PAGE_SIZE = 10;

/** Filtres de l'annuaire, tels qu'ils vivent dans l'URL (`/paroisses?q=&diocese=…`). */
export type DirectoryFilters = {
  q: string;
  city: string;
  diocese: string;
  doyenne: string;
  active: boolean;
  page: number;
};

export const EMPTY_FILTERS: DirectoryFilters = { q: '', city: '', diocese: '', doyenne: '', active: false, page: 1 };

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lecture tolérante des paramètres d'URL : une valeur invalide est ignorée. */
export const parseFilters = (raw: RawParams): DirectoryFilters => {
  const page = Number.parseInt(first(raw.page), 10);
  const diocese = first(raw.diocese);
  const doyenne = first(raw.doyenne);
  return {
    q: first(raw.q).trim().slice(0, 100),
    city: first(raw.city).trim().slice(0, 100),
    diocese: UUID.test(diocese) ? diocese : '',
    doyenne: UUID.test(diocese) && UUID.test(doyenne) ? doyenne : '',
    active: first(raw.active) === '1',
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
};

/** Chaîne de requête canonique (paramètres vides omis) : `?q=point&page=2`. */
export const filtersToSearch = (filters: DirectoryFilters): string => {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.city) params.set('city', filters.city);
  if (filters.diocese) params.set('diocese', filters.diocese);
  if (filters.diocese && filters.doyenne) params.set('doyenne', filters.doyenne);
  if (filters.active) params.set('active', '1');
  if (filters.page > 1) params.set('page', String(filters.page));
  const search = params.toString();
  return search ? `?${search}` : '';
};

/** Paramètres de l'API : le doyenné, plus précis, remplace le diocèse (sous-arbre). */
export const filtersToParams = (filters: DirectoryFilters): DirectoryParams => ({
  q: filters.q || undefined,
  city: filters.city || undefined,
  diocese: filters.doyenne || filters.diocese || undefined,
  on_platform: filters.active ? true : undefined,
  limit: PAGE_SIZE,
  offset: (filters.page - 1) * PAGE_SIZE,
});
