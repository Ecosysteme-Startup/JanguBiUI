import { inMonth, monthTitle, monthWeeks, onDay } from '../calendar';

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
});
