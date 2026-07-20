'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button/button';

import { useResendVerification } from '../api/resend-verification';

/**
 * Demande un nouvel email d'activation.
 *
 * Le message de confirmation reste neutre — il ne doit jamais révéler si
 * l'adresse saisie correspond à un compte, ni si ce compte est déjà activé
 * (le backend applique le même contrat anti-énumération).
 */
export const ResendVerificationForm = () => {
  const [email, setEmail] = useState('');
  const { mutate, isPending, isSuccess } = useResendVerification();

  if (isSuccess) {
    return (
      <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        Si un compte non activé correspond à cette adresse, un nouvel email de
        vérification vient d&apos;être envoyé.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email) mutate({ email });
      }}
      className="flex w-full max-w-sm flex-col gap-2"
    >
      <label htmlFor="resend-email" className="text-sm text-muted-foreground">
        Recevoir un nouveau lien
      </label>
      <input
        id="resend-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="vous@exemple.com"
        autoComplete="email"
        className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <Button type="submit" isLoading={isPending} disabled={isPending}>
        Renvoyer le lien
      </Button>
    </form>
  );
};
