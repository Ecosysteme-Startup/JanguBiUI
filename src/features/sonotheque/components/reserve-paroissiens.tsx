import { Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from '@/components/ui/link';
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
      icon={<Lock />}
      title={`${objet} n’est pas accessible`}
      description="Il est peut-être réservé aux paroissiens d’une autre paroisse, ou n’est plus en ligne. Les enregistrements en accès libre restent à votre disposition."
      action={
        <Button asChild variant="outline">
          <Link href={paths.app.ecouter.root.getHref()}>Revenir à Écouter</Link>
        </Button>
      }
    />
  );
}
