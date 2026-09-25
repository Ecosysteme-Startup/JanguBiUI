import { ApiError } from '@/lib/api-client';

type ErrorRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ErrorRecord =>
  typeof value === 'object' && value !== null;

/** Deux formats coexistent côté API : `{detail, code}` (messagerie) et `{error: {code, message}}` (V1, SRS §7). */
const envelopeOf = (error: unknown): ErrorRecord | null => {
  if (!(error instanceof ApiError) || !isRecord(error.body)) return null;
  return isRecord(error.body.error) ? error.body.error : error.body;
};

/** Code métier de l'erreur (`minor`, `slot_taken`…), ou `null`. */
export const apiErrorCode = (error: unknown): string | null => {
  const envelope = envelopeOf(error);
  return envelope && typeof envelope.code === 'string' ? envelope.code : null;
};

/** Message sûr à afficher : celui du serveur s'il existe, sinon celui de l'ApiError, sinon `fallback`. */
export const apiErrorMessage = (
  error: unknown,
  fallback = 'Une erreur est survenue. Réessayez dans un instant.',
): string => {
  const envelope = envelopeOf(error);
  for (const key of ['message', 'detail']) {
    const value = envelope?.[key];
    if (typeof value === 'string' && value) return value;
  }
  return error instanceof ApiError ? error.message : fallback;
};
