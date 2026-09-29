import { ApiError } from '@/lib/api-client';
import { apiErrorCode, apiErrorMessage, apiFieldErrors, isForbidden } from '@/utils/api-errors';

const v1 = (status: number, error: Record<string, unknown>) => new ApiError(status, 'Message générique', { error });

describe('api-errors', () => {
  it('lit le message et le code de l’enveloppe V1', () => {
    const error = v1(403, { code: 'mfa_required', message: 'Authentification à deux facteurs requise.', details: {} });
    expect(apiErrorMessage(error)).toBe('Authentification à deux facteurs requise.');
    expect(apiErrorCode(error)).toBe('mfa_required');
    expect(isForbidden(error)).toBe(true);
  });

  it('extrait le premier message de chaque champ invalide', () => {
    const error = v1(400, { code: 'validation_error', message: 'Les données envoyées sont invalides.', details: { title: ['Trop long.', 'x'], other: 3 } });
    expect(apiFieldErrors(error)).toEqual({ title: 'Trop long.' });
  });

  it('retombe sur le message de l’erreur hors enveloppe', () => {
    expect(apiErrorMessage(new Error('Pas de connexion.'))).toBe('Pas de connexion.');
    expect(apiErrorMessage(null, 'Défaut')).toBe('Défaut');
    expect(apiFieldErrors(new Error('x'))).toEqual({});
    expect(apiErrorCode(new ApiError(500, 'x', { detail: 'Oups' }))).toBeNull();
    expect(apiErrorMessage(new ApiError(500, 'x', { detail: 'Oups' }))).toBe('Oups');
  });
});
