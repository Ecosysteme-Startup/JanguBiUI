import { ApiError } from '@/lib/api-client';

/** Message lisible pour une erreur d'API de la sonothèque. */
export function messageErreur(err: unknown, repli: string): string {
  if (err instanceof ApiError) {
    if (err.status === 403)
      return 'Vous n’avez pas le droit de publier sur cette source.';
    if (err.status === 413) return 'Ce fichier dépasse 500 Mo.';
    if (
      err.message &&
      !/^(Bad Request|Internal Server Error)$/i.test(err.message)
    ) {
      return err.message;
    }
    return repli;
  }
  if (err instanceof Error && err.message) return err.message;
  return repli;
}

export const estIntrouvable = (err: unknown) =>
  err instanceof ApiError && err.status === 404;
