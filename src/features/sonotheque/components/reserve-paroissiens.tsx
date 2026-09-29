import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { paths } from '@/config/paths';

/**
 * Contenu non visible (API 404) : l'API ne dit pas s'il existe. On reste
 * sobre : il est peut-être réservé aux paroissiens d'une autre paroisse, ou
 * n'est plus en ligne. Jamais culpabilisant.
 */
export function ReserveParoissiens({
  objet = 'Cet enregistrement',
}: {
  objet?: string;
}) {
  return (
    <EmptyState
      icon="cadenas"
      title={`${objet} n’est pas accessible`}
      action={
        <Button asChild variant="outline">
          <NextLink href={paths.app.ecouter.root.getHref()}>
            Revenir à Écouter
          </NextLink>
        </Button>
      }
    >
      Il est peut-être réservé aux paroissiens d’une autre paroisse, ou n’est
      plus en ligne. Les enregistrements en accès libre restent à votre
      disposition.
    </EmptyState>
  );
}
