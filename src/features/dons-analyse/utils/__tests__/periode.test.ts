import { describe, expect, it } from 'vitest';

import { codePeriode, moisCourant } from '../periode';

describe('moisCourant', () => {
  it('donne le mois AAAA-MM de la date fournie', () => {
    expect(moisCourant(new Date('2026-09-27T10:00:00Z'))).toBe('2026-09');
  });

  it('suit le fuseau de Dakar, pas celui du poste', () => {
    // 23 h 30 le 30 septembre à Dakar (UTC+0) : encore septembre, même vu d'un poste à UTC+2.
    expect(moisCourant(new Date('2026-09-30T23:30:00Z'))).toBe('2026-09');
    // Minuit passé à Dakar : octobre, même si un poste à UTC-5 est encore en septembre.
    expect(moisCourant(new Date('2026-10-01T00:30:00Z'))).toBe('2026-10');
  });

  it('prend la date du jour par défaut', () => {
    expect(moisCourant()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });
});

describe('codePeriode', () => {
  it("n'envoie rien pour le mois courant", () => {
    expect(codePeriode('mois', '2026-09', '2026-09')).toBeUndefined();
  });

  it('code un mois passé selon la période', () => {
    expect(codePeriode('mois', '2026-08', '2026-09')).toBe('2026-08');
    expect(codePeriode('trimestre', '2026-08', '2026-09')).toBe('2026-T3');
    expect(codePeriode('annee', '2025-12', '2026-09')).toBe('2025');
  });
});
