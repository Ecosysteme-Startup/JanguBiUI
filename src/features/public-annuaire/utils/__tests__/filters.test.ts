import { EMPTY_FILTERS, filtersToParams, filtersToSearch, parseFilters } from '@/features/public-annuaire/utils/filters';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

const DIOCESE = '0b7b1f0e-0000-4000-8000-000000000002';
const DOYENNE = 'd0000000-0000-4000-8000-000000000101';

describe('filtres de l’annuaire', () => {
  it('lit les paramètres d’URL et ignore les valeurs invalides', () => {
    expect(parseFilters({ q: ' Point E ', page: '3', diocese: DIOCESE, doyenne: DOYENNE, active: '1' })).toEqual({
      q: 'Point E',
      city: '',
      diocese: DIOCESE,
      doyenne: DOYENNE,
      active: true,
      page: 3,
    });
    expect(parseFilters({ page: '-2', diocese: 'pas-un-uuid', doyenne: DOYENNE, active: 'oui' })).toEqual(EMPTY_FILTERS);
  });

  it('produit une URL canonique sans paramètres vides', () => {
    expect(filtersToSearch(EMPTY_FILTERS)).toBe('');
    expect(filtersToSearch({ ...EMPTY_FILTERS, q: 'médina', page: 2 })).toBe('?q=m%C3%A9dina&page=2');
    expect(filtersToSearch({ ...EMPTY_FILTERS, doyenne: DOYENNE })).toBe('');
  });

  it('envoie à l’API le sous-arbre le plus précis et la pagination limit/offset', () => {
    expect(filtersToParams({ ...EMPTY_FILTERS, diocese: DIOCESE, doyenne: DOYENNE, page: 3, active: true })).toEqual({
      q: undefined,
      city: undefined,
      diocese: DOYENNE,
      on_platform: true,
      limit: 10,
      offset: 20,
    });
  });
});
