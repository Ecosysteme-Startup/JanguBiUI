import { plural, pluralWord } from '@/utils/plural';

describe('plural', () => {
  it('garde le singulier pour 0 et 1 (règle française)', () => {
    expect(plural(0, 'demande', 'demandes')).toBe('0 demande');
    expect(plural(1, 'demande', 'demandes')).toBe('1 demande');
  });

  it('met au pluriel au-delà de 1, avec les formes irrégulières fournies', () => {
    expect(plural(2, 'demande', 'demandes')).toBe('2 demandes');
    expect(plural(3, 'lieu', 'lieux')).toBe('3 lieux');
  });

  it('sépare les milliers par une espace insécable', () => {
    expect(plural(1480, 'fidèle', 'fidèles')).toBe('1 480 fidèles');
  });

  it('accorde le mot seul', () => {
    expect(pluralWord(1, 'place', 'places')).toBe('place');
    expect(pluralWord(12, 'place', 'places')).toBe('places');
  });
});
