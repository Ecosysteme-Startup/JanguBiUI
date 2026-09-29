import { hourRange, inMonth, inWeek, monthTitle, monthWeeks, onDay, placeDayEvents, weekDays, weekTitle } from '../calendar';
import { f8aHandlers } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8aHandlers));

describe('calendrier', () => {
  it('découpe le mois en semaines du lundi au dimanche', () => {
    const weeks = monthWeeks('2026-10-15');
    expect(weeks[0][0]).toBe('2026-09-28');
    expect(weeks[0][3]).toBe('2026-10-01');
    expect(weeks.at(-1)?.at(-1)).toBe('2026-11-01');
    expect(weeks).toHaveLength(5);
    expect(monthTitle('2026-10-01')).toBe('Octobre 2026');
  });

  it('place les événements sur leurs jours', () => {
    const event = { start_at: '2026-10-10T08:30:00', end_at: '2026-10-11T16:00:00' };
    expect(onDay(event, '2026-10-10')).toBe(true);
    expect(onDay(event, '2026-10-11')).toBe(true);
    expect(onDay(event, '2026-10-12')).toBe(false);
    expect(inMonth(event, '2026-10-01')).toBe(true);
    expect(inMonth(event, '2026-11-01')).toBe(false);
  });

  it('découpe la semaine du lundi au dimanche et la titre', () => {
    expect(weekDays('2026-10-08')).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
    expect(weekDays('2026-10-11')[0]).toBe('2026-10-05');
    expect(weekTitle('2026-10-08')).toBe('Semaine du 5 au 11 octobre 2026');
    expect(weekTitle('2026-10-01')).toBe('Semaine du 28 septembre au 4 octobre 2026');
    expect(weekTitle('2026-12-30')).toBe('Semaine du 28 décembre 2026 au 3 janvier 2027');
    expect(inWeek({ start_at: '2026-10-11T23:00:00', end_at: '2026-10-11T23:30:00' }, '2026-10-05')).toBe(true);
    expect(inWeek({ start_at: '2026-10-12T00:00:00', end_at: '2026-10-12T01:00:00' }, '2026-10-05')).toBe(false);
  });

  it('place les événements du jour en colonnes quand ils se chevauchent', () => {
    const events = [
      { id: 1, start_at: '2026-10-10T09:00:00', end_at: '2026-10-10T11:00:00' },
      { id: 2, start_at: '2026-10-10T10:00:00', end_at: '2026-10-10T10:30:00' },
      { id: 3, start_at: '2026-10-10T10:30:00', end_at: '2026-10-10T12:00:00' },
      { id: 4, start_at: '2026-10-10T14:00:00', end_at: '2026-10-10T14:00:00' },
      { id: 5, start_at: '2026-10-09T20:00:00', end_at: '2026-10-11T10:00:00' },
    ];

    const placed = placeDayEvents(events, '2026-10-10');

    expect(placed.map((p) => [p.event.id, p.lane, p.lanes])).toEqual([
      [1, 0, 2],
      [2, 1, 2],
      [3, 1, 2],
      [4, 0, 1],
    ]);
    expect(placed.find((p) => p.event.id === 4)).toMatchObject({ startMin: 14 * 60, endMin: 14 * 60 + 30 });
    expect(hourRange(placed)).toEqual({ from: 7, to: 21 });
    expect(hourRange([{ startMin: 5 * 60 + 30, endMin: 23 * 60 + 15 }])).toEqual({ from: 5, to: 24 });
  });
});
