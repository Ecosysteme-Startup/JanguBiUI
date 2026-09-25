import { ApiError } from '@/lib/api-client';

type ErrorRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ErrorRecord => typeof value === 'object' && value !== null;

/** Enveloppe d'erreur V1 (SRS §7) : `{error: {code, message, details}}` ; ancien format `{detail}` toléré. */
const envelopeOf = (error: unknown): ErrorRecord | null => {
  if (!(error instanceof ApiError) || !isRecord(error.body)) return null;
  return isRecord(error.body.error) ? error.body.error : error.body;
};

/** Code métier de l'erreur (`mfa_required`, `sunday_date_invalid`…), ou `null`. */
export const apiErrorCode = (error: unknown): string | null => {
  const envelope = envelopeOf(error);
  return envelope && typeof envelope.code === 'string' ? envelope.code : null;
};

/** Message sûr à afficher : celui du serveur s'il existe, sinon celui de l'`ApiError`, sinon `fallback`. */
export const apiErrorMessage = (error: unknown, fallback = 'Une erreur est survenue. Réessayez dans un instant.'): string => {
  const envelope = envelopeOf(error);
  for (const key of ['message', 'detail']) {
    const value = envelope?.[key];
    if (typeof value === 'string' && value) return value;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

/** Erreurs de champ d'une `validation_error` DRF : `{titre: 'message'}` (premier message de chaque champ). */
export const apiFieldErrors = (error: unknown): Record<string, string> => {
  const details = envelopeOf(error)?.details;
  if (!isRecord(details)) return {};
  return Object.fromEntries(
    Object.entries(details).flatMap(([field, value]) => {
      const first = Array.isArray(value) ? value[0] : value;
      return typeof first === 'string' ? [[field, first]] : [];
    }),
  );
};

/** 403 : action refusée (capacité absente, MFA requise). */
export const isForbidden = (error: unknown): boolean => error instanceof ApiError && error.status === 403;
