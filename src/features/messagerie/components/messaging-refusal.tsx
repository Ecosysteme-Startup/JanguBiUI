import NextLink from 'next/link';

import { Notice } from '@/components/ui/notice';
import { paths } from '@/config/paths';
import { apiErrorCode, apiErrorMessage } from '@/utils/api-errors';

/**
 * Refus expliqué (RG-13) : messagerie réservée aux personnes majeures. Le texte vient du
 * serveur (`MINOR_MESSAGE`) ; le front ne décide pas de l'âge, il explique le refus.
 */
export const MessagingRefusal = ({ error }: { error: unknown }) => {
  const code = apiErrorCode(error);
  const message = apiErrorMessage(
    error,
    'Votre message n’a pas pu être envoyé. Réessayez dans un instant.',
  );
  if (code === 'minor') {
    return (
      <Notice
        tone="warn"
        title="La messagerie est réservée aux personnes majeures"
      >
        {message}
      </Notice>
    );
  }
  if (code === 'birth_date_required') {
    return (
      <Notice tone="warn" title="Votre date de naissance est nécessaire">
        {message}{' '}
        <NextLink href={paths.app.profil.getHref()}>
          Compléter mon profil
        </NextLink>
      </Notice>
    );
  }
  return (
    <Notice tone="err" title="Message non envoyé">
      {message}
    </Notice>
  );
};
