import { progressReducer, START } from '@/features/chapelet/utils/progress';
import { beadsOf, decadeOf, MYSTERIES_BY_DAY, mysteryHeading, parseWeekday } from '@/features/chapelet/utils/rosary';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...paroleHandlers));

const reduce = progressReducer([3, 3]);

describe('progressReducer', () => {
  it('avance dans le mystère, puis au mystère suivant, puis termine', () => {
    let s = START;
    s = reduce(s, { type: 'next' });
    s = reduce(s, { type: 'next' });
    expect(s).toEqual({ mystery: 0, step: 2, done: false });
    s = reduce(s, { type: 'next' });
    expect(s).toEqual({ mystery: 1, step: 0, done: false });
    s = reduce(reduce(reduce(s, { type: 'next' }), { type: 'next' }), { type: 'next' });
    expect(s.done).toBe(true);
    expect(reduce(s, { type: 'next' })).toBe(s);
  });

  it('recule jusqu’au dernier grain du mystère précédent, jamais avant le début', () => {
    expect(reduce({ mystery: 1, step: 0, done: false }, { type: 'prev' })).toEqual({ mystery: 0, step: 2, done: false });
    expect(reduce(START, { type: 'prev' })).toBe(START);
  });

  it('borne les sauts de mystère', () => {
    expect(reduce(START, { type: 'jump', mystery: 9 })).toEqual({ mystery: 1, step: 0, done: false });
  });
});

describe('decadeOf', () => {
  const p = (type: string) => ({ id: type, type, type_display: type, text: type });

  it('reconstitue une dizaine à partir des prières isolées quand le mystère n’en a pas', () => {
    const decade = decadeOf({ id: 1, order: 1, title: 'X', meditation: null, fruit: '', prayers: [] }, [p('OUR_FATHER'), p('HAIL_MARY'), p('GLORY_BE')]);
    expect(beadsOf(decade).map((b) => b.label)).toEqual(['NP', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'G']);
  });

  it('ne fabrique rien si les prières de base manquent', () => {
    expect(decadeOf({ id: 1, order: 1, title: 'X', meditation: null, fruit: '', prayers: [] }, [])).toEqual([]);
  });

  it('titre la dizaine et lit le jour demandé dans l’URL', () => {
    expect(mysteryHeading(3, 'Lumineux')).toBe('Troisième mystère lumineux');
    expect(mysteryHeading(1, 'Mystères joyeux')).toBe('Premier mystère joyeux');
    expect(parseWeekday('0')).toBe(0);
    expect(parseWeekday('6')).toBe(6);
    expect(parseWeekday('7')).toBeNull();
    expect(parseWeekday('lundi')).toBeNull();
    expect(MYSTERIES_BY_DAY.flatMap((r) => r.weekdays).sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
