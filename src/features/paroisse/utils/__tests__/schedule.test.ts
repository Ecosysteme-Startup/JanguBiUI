import type { Occurrence, ParishWeek } from '@/features/paroisse/api/get-parish-week';
import { clockLabel, dayTag, nextOccurrences } from '@/features/paroisse/utils/schedule';

const occ = (date: string, start_time: string, kind = 'messe', note = ''): Occurrence => ({
  date,
  kind,
  start_time,
  end_time: null,
  place_id: 1,
  place_name: 'Église Saint-Dominique',
  language: 'fr',
  note,
  is_exception: false,
});

const week = (occurrences: Occurrence[]): ParishWeek => ({ start: '2026-09-24', end: '2026-09-30', places: [], occurrences });

describe('nextOccurrences', () => {
  it('garde les N prochaines occurrences du type, dans l’ordre, sans les passées', () => {
    const now = new Date('2026-09-24T12:00:00');
    const w = week([
      occ('2026-09-27', '09:30:00'),
      occ('2026-09-24', '07:00:00'),
      occ('2026-09-24', '18:30:00'),
      occ('2026-09-26', '16:00:00', 'confession'),
      occ('2026-09-26', '18:30:00'),
      occ('2026-09-28', '07:00:00'),
    ]);
    expect(nextOccurrences(w, 'messe', now, 3).map((o) => `${o.date} ${o.start_time}`)).toEqual([
      '2026-09-24 18:30:00',
      '2026-09-26 18:30:00',
      '2026-09-27 09:30:00',
    ]);
  });

  it('rend une liste vide sans semaine chargée', () => {
    expect(nextOccurrences(undefined, 'messe', new Date(), 3)).toEqual([]);
  });
});

describe('clockLabel', () => {
  it('affiche l’heure au format horloge de la maquette', () => {
    expect(clockLabel('18:30:00')).toBe('18:30');
    expect(clockLabel('07:00:00')).toBe('07:00');
  });
});

describe('dayTag', () => {
  const now = new Date('2026-09-24T12:00:00');
  it('« ce soir » ou « aujourd’hui » le jour même selon l’heure', () => {
    expect(dayTag('2026-09-24', '18:30:00', now)).toBe('ce soir');
    expect(dayTag('2026-09-24', '12:15:00', now)).toBe('aujourd’hui');
  });
  it('« demain » puis le jour abrégé et sa date', () => {
    expect(dayTag('2026-09-25', '07:00:00', now)).toBe('demain');
    expect(dayTag('2026-09-26', '18:30:00', now)).toBe('sam. 26');
  });
});
