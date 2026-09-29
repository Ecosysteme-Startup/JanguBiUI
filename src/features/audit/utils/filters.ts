import type { AuditFilters } from '../api/get-audit-events';

const TEXT_KEYS = ['node', 'actor', 'action', 'date_from', 'date_to'] as const;

/** Paramètres d'URL → filtres du journal (valeurs vides et décalages invalides ignorés). */
export const auditFiltersFrom = (query: Record<string, string | string[] | undefined>): AuditFilters => {
  const filters: AuditFilters = {};
  TEXT_KEYS.forEach((key) => {
    const value = query[key];
    if (typeof value === 'string' && value) filters[key] = value;
  });
  const offset = Number(query.offset);
  if (Number.isInteger(offset) && offset > 0) filters.offset = offset;
  return filters;
};
