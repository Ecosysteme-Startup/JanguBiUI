import type { Metadata } from 'next';
import NextLink from 'next/link';

import { ErrorScreen } from '@/components/errors/error-screen';
import { buttonVariants } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { frenchTypo } from '@/utils/french-typo';
import { safeRedirect } from '@/utils/safe-redirect';

import { authErrorMessage } from './auth-error-message';

export const metadata: Metadata = { title: 'Connexion interrompue', robots: { index: false } };

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * Page d'erreur de connexion (`pages.error` d'Auth.js) : sans shell connecté, en français,
 * avec une seule issue claire — recommencer la connexion.
 */
const ConnexionErreurPage = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await searchParams;
  const { title, body } = authErrorMessage(first(params.error));
  const redirectTo = safeRedirect(first(params.redirectTo));

  return (
    <ErrorScreen
      code="Connexion"
      title={frenchTypo(title)}
      actions={
        <>
          {/* Lien classique (pas de prefetch) : `/connexion` est une route qui redirige vers Keycloak. */}
          <a
            href={paths.auth.connexion.getHref(redirectTo)}
            className={buttonVariants({ variant: 'primary' })}
          >
            Recommencer la connexion
          </a>
          <NextLink href={paths.home.getHref()}>Revenir à l&apos;accueil</NextLink>
        </>
      }
    >
      <p className="m-0">{frenchTypo(body)}</p>
    </ErrorScreen>
  );
};

export default ConnexionErreurPage;
