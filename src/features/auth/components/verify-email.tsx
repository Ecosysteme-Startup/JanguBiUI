'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button/button';
import { paths } from '@/config/paths';
import { useVerifyEmail } from '@/lib/auth';

import { ResendVerificationForm } from './resend-verification-form';

export const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';
  const { mutate, isPending, isSuccess, isError } = useVerifyEmail();
  const triggered = useRef(false);

  useEffect(() => {
    if (token && !triggered.current) {
      triggered.current = true;
      mutate({ token });
    }
  }, [token, mutate]);

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <XCircle className="size-12 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          Aucun token de vérification trouvé.
        </p>
        <NextLink
          href={paths.auth.login.getHref()}
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Retour à la connexion
        </NextLink>
      </div>
    );
  }

  if (isPending || (!isSuccess && !isError)) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Vérification en cours…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <XCircle className="size-12 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          Le lien de vérification est invalide ou a expiré.
        </p>
        {/* Le lien expire au bout de 24 h et la réinscription est refusée : sans
            renvoi, l'utilisateur est bloqué pour de bon. */}
        <ResendVerificationForm />
        <NextLink
          href={paths.auth.login.getHref()}
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Retour à la connexion
        </NextLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <CheckCircle2 className="size-12 text-success" />
      <p className="text-sm font-medium text-foreground">
        Email vérifié avec succès ! Vous pouvez maintenant vous connecter.
      </p>
      <Button asChild size="lg">
        <NextLink href={paths.auth.login.getHref()}>Se connecter</NextLink>
      </Button>
    </div>
  );
};
