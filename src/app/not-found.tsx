import NextLink from 'next/link';

import { paths } from '@/config/paths';

const NotFound = () => (
  <main id="contenu" className="mx-auto flex min-h-dvh max-w-reading flex-col justify-center px-4 py-16">
    <p className="tnum m-0 text-meta text-ink-3">Erreur 404</p>
    <h1 className="m-0 mt-3 font-serif text-title font-normal text-ink">Cette page n&apos;existe pas.</h1>
    <p className="mt-4 text-body text-ink-2">Le lien est peut-être ancien, ou la page a changé d&apos;adresse.</p>
    <p className="mt-6 flex gap-6">
      <NextLink href={paths.home.getHref()}>Revenir à l&apos;accueil</NextLink>
      <NextLink href={paths.parole.getHref()}>Lire la Parole du jour</NextLink>
    </p>
  </main>
);

export default NotFound;
