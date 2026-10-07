import {
  closingFormula,
  dayTileLabel,
  parseIsoDate,
  readingLabel,
  readingPlainText,
  readingShortTitle,
  readingTabLabel,
  readingTitle,
  weekOf,
  yearLine,
} from '@/features/parole/utils/liturgy';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...paroleHandlers));

describe('utilitaires de la Parole', () => {
  it('nomme les lectures d’après leur type', () => {
    expect(readingLabel('lecture_1')).toBe('Première lecture');
    expect(readingLabel('lecture2')).toBe('Deuxième lecture');
    expect(readingLabel('evangile')).toBe('Évangile');
    expect(readingLabel('psaume')).toBe('Psaume');
  });

  it('n’acclame pas après un psaume', () => {
    expect(closingFormula('psaume')).toBeNull();
    expect(closingFormula('evangile')).toBe('— Acclamons la Parole de Dieu.');
    expect(closingFormula('lecture_1')).toBe('— Parole du Seigneur.');
  });

  it('refuse les dates invalides de l’URL', () => {
    expect(parseIsoDate('2026-09-23')).toBe('2026-09-23');
    expect(parseIsoDate('2026-02-30')).toBeUndefined();
    expect(parseIsoDate('demain')).toBeUndefined();
    expect(parseIsoDate(undefined)).toBeUndefined();
  });

  it('construit la semaine du lundi au dimanche', () => {
    expect(weekOf('2026-09-24')).toEqual(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']);
    expect(weekOf('2026-09-27')[0]).toBe('2026-09-21');
    expect(weekOf('2026-09-21')[6]).toBe('2026-09-27');
  });

  it('abrège le libellé du jour dans la bande de dates', () => {
    expect(dayTileLabel({ rank: 'ferie', celebration: 'Jeudi de la 25e semaine' })).toBe('Férie');
    expect(dayTileLabel({ rank: 'dimanche', celebration: '26e dimanche du temps ordinaire' })).toBe('Dimanche');
    expect(dayTileLabel({ rank: 'fete', celebration: 'Saint Matthieu, apôtre et évangéliste' })).toBe('S. Matthieu');
    expect(dayTileLabel({ rank: 'memoire', celebration: 'Sainte Thérèse de l’Enfant-Jésus' })).toBe('Ste Thérèse de l’Enfant-Jésus');
  });

  it('dit l’année liturgique', () => {
    expect(yearLine({ rank: 'ferie', sunday_cycle: 'A', weekday_cycle: 'II' })).toBe('Année paire, cycle A');
    expect(yearLine({ rank: 'dimanche', sunday_cycle: 'B', weekday_cycle: 'I' })).toBe('Cycle B');
  });

  it('nomme les onglets de lecture selon leur nombre', () => {
    const semaine = [{ type: 'lecture_1' }, { type: 'psaume' }, { type: 'evangile' }];
    expect(semaine.map((_, i) => readingTabLabel(semaine, i))).toEqual(['Lecture', 'Psaume', 'Évangile']);
    const dimanche = [{ type: 'lecture_1' }, { type: 'psaume' }, { type: 'lecture_2' }, { type: 'evangile' }];
    expect(dimanche.map((_, i) => readingTabLabel(dimanche, i))).toEqual(['1re lecture', 'Psaume', '2e lecture', 'Évangile']);
  });

  it('résume une lecture en titre court et en texte à copier', () => {
    const reading = {
      type: 'evangile',
      citation: 'Lc 9, 7-9',
      text: null,
      verses: [
        { book: 'Luc', chapter: 9, number: 7, text: 'Hérode entendit parler.' },
        { book: 'Luc', chapter: 9, number: 8, text: 'Car les uns disaient.' },
      ],
    };
    // Aucun titre composé : titre AELF s'il existe, sinon la référence de l'API.
    expect(readingShortTitle(reading)).toBe('Lc 9, 7-9');
    expect(readingTitle(reading)).toBeNull();
    expect(readingTitle({ ...reading, aelf: { titre: 'Évangile selon saint Luc (AELF)' } })).toBe('Évangile selon saint Luc (AELF)');
    expect(readingShortTitle({ ...reading, aelf: { titre: 'Titre AELF' } })).toBe('Titre AELF');
    expect(readingPlainText(reading)).toBe('Évangile · Lc 9, 7-9\n\n7 Hérode entendit parler.\n8 Car les uns disaient.');
    expect(readingShortTitle({ ...reading, verses: [] })).toBe('Lc 9, 7-9');
    expect(readingPlainText({ ...reading, verses: [], text: '<p>Hérode <em>entendit</em>.</p>' })).toBe('Évangile · Lc 9, 7-9\n\nHérode entendit.');
  });
});
