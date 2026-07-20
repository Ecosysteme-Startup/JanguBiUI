/**
 * Aplatit en une chaîne lisible le `detail` d'une erreur DRF.
 *
 * `apps/api/exception_handlers.py` enveloppe les erreurs de validation ainsi :
 *
 *     if isinstance(exc.detail, (list, dict)):
 *         response.data = {"detail": response.data}
 *
 * Donc toute erreur PAR CHAMP — le cas le plus courant : un numéro de téléphone
 * au format local, un mot de passe trop court — arrive sous la forme
 * `{"detail": {"phone_number": ["…"]}}`, c'est-à-dire un OBJET.
 *
 * Le client faisait `body.detail as string` : un transtypage qui ment, que
 * TypeScript ne peut pas vérifier. L'objet finissait passé à React comme enfant
 * (`<p>{message}</p>`), ce qui lève « Objects are not valid as a React child » —
 * l'écran entier était alors remplacé par la page d'erreur et la saisie perdue,
 * au lieu d'afficher le message de validation (audit beta 2026-07-20).
 */
export function flattenApiError(detail: unknown): string | undefined {
  if (detail == null) return undefined;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const parts = detail.map(flattenApiError).filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  if (typeof detail === 'object') {
    // Erreurs par champ : on ignore les clés (techniques, en anglais) et on ne
    // garde que les messages, déjà rédigés en français par les serializers.
    const parts = Object.values(detail as Record<string, unknown>)
      .map(flattenApiError)
      .filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  return String(detail);
}
