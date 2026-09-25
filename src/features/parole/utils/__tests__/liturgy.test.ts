import { calendarLine, closingFormula, dayWindow, parseIsoDate, readingLabel, rosaryOfDay } from '@/features/parole/utils/liturgy';
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

  it('construit la fenêtre de jours et les mystères du jour', () => {
    expect(dayWindow('2026-09-24').map((d) => d.iso)).toEqual(['2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']);
    expect(rosaryOfDay('2026-09-24')).toEqual({ weekday: 'jeudi', group: 'lumineux' });
    expect(rosaryOfDay('2026-09-27').group).toBe('glorieux');
  });

  it('résume le calendrier d’un dimanche avec son année liturgique', () => {
    expect(
      calendarLine({
        liturgical_year: 2026, season: 'ordinaire', season_label: 'Temps ordinaire', week: 26,
        celebration: '26e dimanche du temps ordinaire', rank: 'dimanche', color: 'vert', sunday_cycle: 'A', weekday_cycle: 'II',
      }),
    ).toBe('Dimanche · 26e dimanche du temps ordinaire · année A');
  });
});
