import { describe, expect, test } from 'vitest';

import { flattenApiError } from '../flatten-api-error';

describe('flattenApiError', () => {
  test('laisse passer une chaîne', () => {
    expect(flattenApiError('Compte introuvable.')).toBe('Compte introuvable.');
  });

  test('aplatit une erreur DRF par champ — le cas qui faisait sauter l’écran', () => {
    // Forme réelle produite par apps/api/exception_handlers.py
    const detail = { phone_number: ['Le numéro doit être au format international.'] };

    expect(flattenApiError(detail)).toBe(
      'Le numéro doit être au format international.',
    );
  });

  test('concatène plusieurs champs en erreur', () => {
    const detail = {
      email: ['Un compte avec cet email existe déjà.'],
      password: ['Ce mot de passe est trop court.'],
    };

    expect(flattenApiError(detail)).toBe(
      'Un compte avec cet email existe déjà. Ce mot de passe est trop court.',
    );
  });

  test('gère les structures imbriquées', () => {
    expect(flattenApiError({ a: { b: ['Erreur profonde.'] } })).toBe(
      'Erreur profonde.',
    );
  });

  test('rend undefined sur vide, pour laisser le repli agir', () => {
    expect(flattenApiError(undefined)).toBeUndefined();
    expect(flattenApiError(null)).toBeUndefined();
    expect(flattenApiError({})).toBeUndefined();
    expect(flattenApiError([])).toBeUndefined();
  });

  test('ne renvoie JAMAIS autre chose qu’une chaîne ou undefined', () => {
    // La garantie qui compte : ce qui sort part dans du JSX.
    for (const input of [{ a: 1 }, [1, 2], 42, true, { x: { y: {} } }]) {
      const out = flattenApiError(input);
      expect(out === undefined || typeof out === 'string').toBe(true);
    }
  });
});
