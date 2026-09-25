import { nextSunday, parseDateParam, shiftDay, weekOf } from '@/features/public-parole/utils/days';
import { readingAnchor, readingExcerpt, readingLabel, sanitizeReadingHtml } from '@/features/public-parole/utils/readings';

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
});
