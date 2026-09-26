import { assignmentBadge } from '../assignment-status';

const NOW = '2026-09-26';

describe('assignmentBadge', () => {
  it('nomme « À venir » une nomination proposée', () => {
    expect(assignmentBadge({ status: 'proposee', end_date: null }, NOW)).toMatchObject({ label: 'À venir', tone: 'info' });
  });

  it('signale « Prend fin » une nomination en vigueur qui se termine dans le mois', () => {
    expect(assignmentBadge({ status: 'active', end_date: '2026-09-30' }, NOW)).toEqual({ label: 'Prend fin', tone: 'warn', endingSoon: true });
  });

  it('reste « En vigueur » si la fin est plus tard, ou absente', () => {
    expect(assignmentBadge({ status: 'active', end_date: '2027-09-30' }, NOW)).toMatchObject({ label: 'En vigueur', tone: 'ok' });
    expect(assignmentBadge({ status: 'active', end_date: null }, NOW)).toMatchObject({ label: 'En vigueur', endingSoon: false });
  });

  it('nomme « Échue » une nomination terminée et « Annulée » une annulée', () => {
    expect(assignmentBadge({ status: 'terminee', end_date: '2026-08-31' }, NOW).label).toBe('Échue');
    expect(assignmentBadge({ status: 'annulee', end_date: null }, NOW).label).toBe('Annulée');
  });
});
