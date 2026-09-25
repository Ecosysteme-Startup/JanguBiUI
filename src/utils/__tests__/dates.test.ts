import { dayNumber, hour, longDate } from '../dates';

describe('dates en français', () => {
  it('formate une date longue avec majuscule', () => {
    expect(longDate('2026-09-24')).toBe('Jeudi 24 septembre 2026');
  });
  it('donne le jour de l’année', () => {
    expect(dayNumber('2026-09-24')).toBe(267);
  });
  it('écrit les heures à la française', () => {
    expect(hour('2026-09-24T18:30:00')).toBe('18 h 30');
    expect(hour('2026-09-24T18:00:00')).toBe('18 h');
  });
});
