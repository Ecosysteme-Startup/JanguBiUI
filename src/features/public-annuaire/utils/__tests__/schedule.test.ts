import type { Occurrence } from '@/features/public-annuaire/api/get-node-week';
import { formatTime, nextMassToday, occurrenceLabel, nextMassPhrase, scheduleByPlace, slotWhen, upcomingMasses, weeklyRows } from '@/features/public-annuaire/utils/schedule';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

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

describe('prochaines messes et semaine type', () => {
  const week = [
    occ({ date: '2026-09-26', kind: 'confession', start_time: '16:00:00', end_time: '18:00:00' }),
    occ({ date: '2026-09-26', start_time: '18:30:00' }),
    occ({ date: '2026-09-27', start_time: '11:30:00' }),
    occ({ date: '2026-09-27', start_time: '09:30:00', note: 'messe des étudiants' }),
    occ({ date: '2026-09-28', start_time: '07:00:00' }),
    occ({ date: '2026-09-28', start_time: '18:30:00' }),
    occ({ date: '2026-09-29', start_time: '07:00:00' }),
    occ({ date: '2026-09-29', start_time: '18:30:00' }),
  ];

  it('garde les messes à venir, dans l’ordre', () => {
    const next = upcomingMasses(week, '2026-09-26', '17:00');
    expect(next.map((o) => `${o.date} ${o.start_time}`)).toEqual([
      '2026-09-26 18:30:00',
      '2026-09-27 09:30:00',
      '2026-09-27 11:30:00',
      '2026-09-28 07:00:00',
      '2026-09-28 18:30:00',
      '2026-09-29 07:00:00',
      '2026-09-29 18:30:00',
    ]);
    expect(upcomingMasses(week, '2026-09-26', '19:00')[0]?.date).toBe('2026-09-27');
  });

  it('situe un créneau par rapport à maintenant', () => {
    expect(slotWhen(occ({ date: '2026-09-26', start_time: '07:00:00' }), '2026-09-26', '10:00')).toBe('passée');
    expect(slotWhen(occ({ date: '2026-09-26', start_time: '18:30:00' }), '2026-09-26', '10:00')).toBe('ce soir');
    expect(slotWhen(occ({ date: '2026-09-26', start_time: '11:00:00' }), '2026-09-26', '10:00')).toBe('aujourd’hui');
    expect(slotWhen(occ({ date: '2026-09-27', start_time: '09:30:00' }), '2026-09-26', '10:00')).toBe('dim. 27');
  });

  it('résume la semaine par jour, en regroupant les jours identiques', () => {
    expect(weeklyRows(week)).toEqual([
      { label: 'Dimanche', text: '9 h 30 (messe des étudiants), 11 h 30' },
      { label: 'Lundi et mardi', text: '7 h, 18 h 30' },
      { label: 'Samedi', text: 'Confessions de 16 h à 18 h, 18 h 30' },
    ]);
  });

  it('nomme une suite de trois jours ou plus « du … au … »', () => {
    const days = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'].map((date) => occ({ date, start_time: '07:00:00' }));
    expect(weeklyRows(days)).toEqual([{ label: 'Du lundi au vendredi', text: '7 h' }]);
  });
});

describe('prochaine messe en toutes lettres', () => {
  it('dit « aujourd’hui », « demain » ou le jour', () => {
    expect(nextMassPhrase(occ({ date: '2026-09-26', start_time: '18:30:00' }), '2026-09-26')).toBe('aujourd’hui à 18 h 30');
    expect(nextMassPhrase(occ({ date: '2026-09-27', start_time: '07:00:00' }), '2026-09-26')).toBe('demain à 7 h');
    expect(nextMassPhrase(occ({ date: '2026-09-29', start_time: '07:00:00' }), '2026-09-26')).toBe('mardi à 7 h');
  });
});
