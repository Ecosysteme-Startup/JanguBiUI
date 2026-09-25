import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from '@/lib/api-client';

/**
 * Reporte sous chaque champ les erreurs de validation DRF (`{champ: [messages]}`).
 * Renvoie le message général à afficher quand aucune erreur ne vise un champ connu.
 */
export const applyServerErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null => {
  if (!(error instanceof ApiError)) return error instanceof Error ? error.message : 'L’enregistrement a échoué.';
  const body = error.body;
  let matched = false;
  if (body && typeof body === 'object') {
    Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
      const field = fields.find((f) => f === key);
      const message = Array.isArray(value) ? String(value[0]) : typeof value === 'string' ? value : null;
      if (field && message) {
        setError(field, { type: 'server', message });
        matched = true;
      }
    });
  }
  return matched ? null : error.message;
};
