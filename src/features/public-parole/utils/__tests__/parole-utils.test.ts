import { nextSunday, parseDateParam, shiftDay, weekOf } from '@/features/public-parole/utils/days';
import { findReading, readingAnchor, readingExcerpt, readingLabel, readingTitle, readingTabs, shortCitation } from '@/features/public-parole/utils/readings';
import { sanitizeReadingHtml } from '@/features/public-parole/utils/sanitize-reading';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

describe('dates de la Parole', () => {
  it('n’accepte qu’une date valide au format AAAA-MM-JJ', () => {
    expect(parseDateParam('2026-09-24')).toBe('2026-09-24');
    expect(parseDateParam(['2026-09-24', 'x'])).toBe('2026-09-24');
    expect(parseDateParam('2026-02-30')).toBeUndefined();
    expect(parseDateParam('24/09/2026')).toBeUndefined();
    expect(parseDateParam(undefined)).toBeUndefined();
  });

  it('calcule la veille, la semaine (lundi → dimanche) et le dimanche suivant', () => {
    expect(shiftDay('2026-10-01', -1)).toBe('2026-09-30');
    expect(weekOf('2026-09-24')).toEqual(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']);
    expect(nextSunday('2026-09-24')).toBe('2026-09-27');
    expect(nextSunday('2026-09-27')).toBe('2026-10-04');
  });
});

describe('lectures', () => {
  it('nomme les lectures en français', () => {
    expect(readingLabel('lecture_1')).toBe('Première lecture');
    expect(readingLabel('lecture2')).toBe('Deuxième lecture');
    expect(readingLabel('psaume')).toBe('Psaume');
    expect(readingLabel('evangile')).toBe('Évangile');
    expect(readingLabel('acclamation_evangile')).toBe('Acclamation de l’Évangile');
    expect(readingLabel('sequence')).toBe('Séquence');
  });

  it('donne une ancre stable', () => {
    expect(readingAnchor({ type: 'lecture_1', citation: '', verses: [] }, 0)).toBe('lecture-1');
    expect(readingAnchor({ type: '', citation: '', verses: [] }, 2)).toBe('lecture-3');
  });

  it('nettoie le HTML AELF', () => {
    const clean = sanitizeReadingHtml('<p onclick="x()"><sup>2</sup>Texte</p><script>alert(1)</script><a href="javascript:x">lien</a>');
    expect(clean).toBe('<p><sup>2</sup>Texte</p>lien');
  });

  it('extrait la première phrase d’une lecture', () => {
    expect(readingExcerpt({ type: 'lecture_1', citation: '', verses: [{ book: 'Ec', chapter: 1, number: 2, text: 'Vanité. Tout est vanité.' }] })).toEqual({
      text: 'Vanité.',
      verse: 2,
    });
    expect(readingExcerpt({ type: 'evangile', citation: '', text: '<p><sup>7</sup>Hérode entendit parler ; il ne savait que penser.</p>', verses: [] })?.text).toBe(
      'Hérode entendit parler ;',
    );
    expect(readingExcerpt({ type: 'psaume', citation: '', text: null, verses: [] })).toBeNull();
  });

  const verse = (book: string) => [{ book, chapter: 1, number: 2, text: 'x' }];

  it('titre une lecture par le titre AELF, sinon par sa référence (rien de composé)', () => {
    expect(readingTitle({ type: 'lecture_1', citation: 'Qo 11, 9 – 12, 8', verses: verse('Ecclésiaste') })).toBe('Qo 11, 9 – 12, 8');
    expect(readingTitle({ type: 'evangile', citation: 'Lc 9, 43b-45', verses: verse('Luc') })).toBe('Lc 9, 43b-45');
    expect(readingTitle({ type: 'lecture_1', citation: 'Qo 11', verses: [], aelf: { titre: 'Lecture du livre de Qohèleth' } })).toBe('Lecture du livre de Qohèleth');
  });

  it('abrège une référence de psaume pour une grille', () => {
    expect(shortCitation('Ps 89 (90), 3-4, 5-6, 12-13')).toBe('Ps 89 (90)');
    expect(shortCitation('Lc 9, 7-9')).toBe('Lc 9, 7-9');
  });

  it('retrouve la première lecture, le psaume et l’évangile', () => {
    const readings = [
      { type: 'lecture_1', citation: 'A', verses: [] },
      { type: 'psaume', citation: 'B', verses: [] },
      { type: 'lecture_2', citation: 'C', verses: [] },
      { type: 'evangile', citation: 'D', verses: [] },
    ];
    expect(findReading(readings, 'lecture')?.citation).toBe('A');
    expect(findReading(readings, 'psaume')?.citation).toBe('B');
    expect(findReading(readings, 'evangile')?.citation).toBe('D');
  });

  it('range les lectures en trois onglets (lectures, psaume, évangile)', () => {
    const readings = [
      { type: 'lecture_1', citation: 'A', verses: [] },
      { type: 'psaume', citation: 'B', verses: [] },
      { type: 'lecture_2', citation: 'C', verses: [] },
      { type: 'acclamation', citation: 'E', verses: [] },
      { type: 'evangile', citation: 'D', verses: [] },
    ];
    expect(readingTabs(readings).map((tab) => [tab.key, tab.readings.map((r) => r.citation)])).toEqual([
      ['lectures', ['A', 'C']],
      ['psaume', ['B']],
      ['evangile', ['E', 'D']],
    ]);
  });
});
