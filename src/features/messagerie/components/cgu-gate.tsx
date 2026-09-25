'use client';

import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { paths } from '@/config/paths';

import { useAcceptMessagingCgu } from '../api/messaging-cgu';

/** Acceptation des conditions de messagerie (une fois pour toutes les conversations). */
export const CguGate = () => {
  const accept = useAcceptMessagingCgu();
  return (
    <div className="flex flex-1 flex-col justify-center gap-4 px-4 py-8 lg:px-6">
      <h2 className="m-0 font-serif text-h3 font-normal text-ink">
        Avant votre premier message
      </h2>
      <p className="m-0 max-w-reading text-body text-ink-2">
        La messagerie sert à l’accompagnement : une question de foi, un conseil,
        un rendez-vous. Vos échanges restent entre vous et le prêtre ; ils sont
        effacés automatiquement après une période d’inactivité.{' '}
        <NextLink href={paths.conditions.getHref()}>
          Lire les conditions d’utilisation
        </NextLink>
      </p>
      {accept.isError && (
        <Notice tone="err" title="L’acceptation n’a pas été enregistrée">
          Réessayez dans un instant.
        </Notice>
      )}
      <div>
        <Button onClick={() => accept.mutate()} disabled={accept.isPending}>
          J’accepte les conditions de la messagerie
        </Button>
      </div>
    </div>
  );
};
