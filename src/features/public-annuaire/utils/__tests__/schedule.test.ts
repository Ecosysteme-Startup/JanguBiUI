import type { Occurrence } from '@/features/public-annuaire/api/get-node-week';
import { formatTime, nextMassToday, occurrenceLabel, scheduleByPlace } from '@/features/public-annuaire/utils/schedule';

const occ = (partial: Partial<Occurrence>): Occurrence => ({
  date: '2026-09-27',
  kind: 'messe',
  start_time: '09:30:00',
  end_time: null,
  place_id: 1,
  place_name: 'Église',
  language: 'fr',
  note: '',
  is_exception: false,
  ...partial,
});

describe('horaires', () => {
  it('écrit les heures à la française', () => {
    expect(formatTime('07:30:00')).toBe('7 h 30');
    expect(formatTime('18:00')).toBe('18 h');
  });

  it('décrit une occurrence : plage pour les confessions, note pour la messe', () => {
    expect(occurrenceLabel(occ({ kind: 'confession', start_time: '16:00', end_time: '18:00' }))).toBe('16 h-18 h confessions');
    expect(occurrenceLabel(occ({ note: 'messe des étudiants' }))).toBe('9 h 30 messe des étudiants');
  });

  it('regroupe par lieu (principal d’abord) puis par jour, dans l’ordre des heures', () => {
    const places = [
      { id: 2, name: 'Chapelle', kind: 'chapelle', is_main: false },
      { id: 1, name: 'Église', kind: 'eglise_paroissiale', is_main: true },
    ];
    const result = scheduleByPlace(places, [occ({ start_time: '11:30' }), occ({ start_time: '07:30' }), occ({ place_id: 2, date: '2026-09-30' })]);
    expect(result.map((r) => r.place.name)).toEqual(['Église', 'Chapelle']);
    expect(result[0].days[0].items.map((i) => i.start_time)).toEqual(['07:30', '11:30']);
  });

  it('trouve la prochaine messe du jour après l’heure donnée', () => {
    const list = [occ({ date: '2026-09-24', start_time: '07:00:00' }), occ({ date: '2026-09-24', start_time: '18:30:00' })];
    expect(nextMassToday(list, '2026-09-24', '12:00')?.start_time).toBe('18:30:00');
    expect(nextMassToday(list, '2026-09-24', '19:00')).toBeUndefined();
  });
});
