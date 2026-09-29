import { clock, exceptionForSlot, findOverlap, formatRange, formatTime, massesPerWeek, weekdayOf } from '../schedule';
import { f8aHandlers } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8aHandlers));

describe('horaires', () => {
  it('formate les heures à la française', () => {
    expect(formatTime('07:00:00')).toBe('7 h 00');
    expect(formatTime('19:15')).toBe('19 h 15');
    expect(formatRange('16:00:00', '18:00:00')).toBe('16 h-18 h');
    expect(formatRange('19:15:00', '20:45:00')).toBe('19 h 15-20 h 45');
    expect(formatRange('07:00:00', null)).toBe('7 h 00');
  });

  it('signale le chevauchement et propose de terminer plus tôt', () => {
    const existing = [{ kind: 'adoration' as const, weekday: 2, start_time: '20:30:00', end_time: '21:30:00' }];
    expect(findOverlap({ weekday: 2, start_time: '19:15', end_time: '20:45' }, existing)).toEqual({
      field: 'end',
      message: 'Chevauche l’adoration de 20 h 30 à 21 h 30 le mercredi. Terminez au plus tard à 20 h 30.',
    });
  });

  it('compte une heure pour un horaire sans fin', () => {
    const existing = [{ kind: 'messe' as const, weekday: 0, start_time: '07:00:00', end_time: null }];
    expect(findOverlap({ weekday: 0, start_time: '07:30', end_time: null }, existing)?.field).toBe('start');
    expect(findOverlap({ weekday: 0, start_time: '08:00', end_time: null }, existing)).toBeNull();
    expect(findOverlap({ weekday: 1, start_time: '07:00', end_time: null }, existing)).toBeNull();
  });

  it('compte les messes de la semaine', () => {
    expect(massesPerWeek([{ kind: 'messe' }, { kind: 'confession' }, { kind: 'messe' }])).toBe(2);
  });

  it('affiche l’heure des grilles comme la maquette (« 7:00 »)', () => {
    expect(clock('07:00:00')).toBe('7:00');
    expect(clock('19:15')).toBe('19:15');
  });

  it('donne le jour de la semaine d’une date, lundi = 0', () => {
    expect(weekdayOf('2026-10-04')).toBe(6);
    expect(weekdayOf('2026-10-05')).toBe(0);
  });

  it('retrouve la prochaine exception qui touche un horaire de la semaine type', () => {
    const slot = { kind: 'messe' as const, weekday: 6, start_time: '09:30:00' };
    const exceptions = [
      { id: 1, date: '2026-10-11', kind: 'messe' as const, cancelled: true, start_time: '09:30', end_time: null, note: '' },
      { id: 2, date: '2026-10-04', kind: 'messe' as const, cancelled: true, start_time: '09:30:00', end_time: null, note: '' },
      { id: 3, date: '2026-10-04', kind: 'messe' as const, cancelled: true, start_time: '11:30:00', end_time: null, note: '' },
    ];
    expect(exceptionForSlot(slot, exceptions)?.id).toBe(2);
    expect(exceptionForSlot({ ...slot, kind: 'confession' }, exceptions)).toBeUndefined();
  });

  it('une annulation de toute la journée touche tous les horaires du jour', () => {
    const slot = { kind: 'messe' as const, weekday: 5, start_time: '18:30:00' };
    const allDay = { id: 4, date: '2026-10-10', kind: 'messe' as const, cancelled: true, start_time: null, end_time: null, note: '' };
    expect(exceptionForSlot(slot, [allDay])?.id).toBe(4);
  });
});
