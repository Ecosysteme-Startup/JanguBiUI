import { monthGrid, monthLabel, monthStartOf, pillName } from '../month';

describe('calendrier du mois (FID-Confession-RDV)', () => {
  it('commence au lundi de la première semaine et finit au dimanche de la dernière', () => {
    const days = monthGrid('2026-09-01');
    expect(days[0]).toEqual({ day: '2026-08-31', inMonth: false });
    expect(days.at(-1)).toEqual({ day: '2026-10-04', inMonth: false });
    expect(days).toHaveLength(35);
    expect(days.filter((d) => d.inMonth)).toHaveLength(30);
  });

  it('libellé et début de mois', () => {
    expect(monthLabel('2026-09-01')).toBe('Septembre 2026');
    expect(monthStartOf('2026-09-26T16:20:00')).toBe('2026-09-01');
  });

  it('nom court d’un prêtre pour les pilules : titre et nom', () => {
    expect(pillName('Abbé Augustin Ndiaye')).toBe('Abbé Ndiaye');
    expect(pillName('Père Emmanuel Tine')).toBe('Père Tine');
    expect(pillName('Joseph Sarr')).toBe('Joseph Sarr');
    expect(pillName('Sarr')).toBe('Sarr');
  });
});
