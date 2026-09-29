'use client';

import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';

/** Le serveur refuse une action de responsable faute de double authentification (403 `mfa_required`). */
export const isMfaRequired = (error: unknown): boolean => {
  if (!(error instanceof ApiError) || error.status !== 403) return false;
  const body = error.body as { error?: { code?: string }; code?: string } | null;
  return body?.error?.code === 'mfa_required' || body?.code === 'mfa_required';
};

/** Invitation à se reconnecter : Keycloak fait alors enrôler (ou saisir) le code à usage unique. */
export const MfaRequiredNotice = () => {
  const pathname = usePathname() ?? paths.espace.root.getHref('');
  return (
    <EmptyState icon="bouclier" title="Double authentification requise">
      Les espaces de responsable demandent un code à usage unique en plus du mot de passe. Reconnectez-vous : Jàngu Bi vous
      guidera pour configurer votre application d&apos;authentification.
      <span className="mt-4 block">
        <Button asChild>
          <a href={paths.auth.connexion.getHref(pathname, { reauth: true })}>Me reconnecter avec la double authentification</a>
        </Button>
      </span>
    </EmptyState>
  );
};
