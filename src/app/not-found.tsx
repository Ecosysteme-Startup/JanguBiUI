import NextLink from 'next/link';

import { ErrorScreen } from '@/components/errors/error-screen';
import { paths } from '@/config/paths';

const NotFound = () => (
  <ErrorScreen
    code="Erreur 404"
    title="Cette page n’existe pas."
    actions={
      <>
        <NextLink href={paths.home.getHref()}>Revenir à l&apos;accueil</NextLink>
        <NextLink href={paths.parole.getHref()}>Lire la Parole du jour</NextLink>
      </>
    }
  >
    <p className="m-0">Le lien est peut-être ancien, ou la page a changé d&apos;adresse.</p>
  </ErrorScreen>
);

export default NotFound;
