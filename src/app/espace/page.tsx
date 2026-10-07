'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { isMfaRequired, MfaRequiredNotice } from '@/components/layouts/mfa-required-notice';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { hrefOfContextForUser, useContexts } from '@/lib/can';

/** `/espace` : ouvre le premier contexte disponible (lien « Espace paroisse » du pied de page). */
const EspaceIndexPage = () => {
  const router = useRouter();
  const { data: grants = [], contexts, isPending, error } = useContexts();
  const first = contexts[0];
  useEffect(() => {
    // Première rubrique ouverte selon les capacités (et non le tableau de bord, refusé à un vicaire).
    if (first) router.replace(hrefOfContextForUser(grants, first));
  }, [first, grants, router]);
  return (
    <main id="contenu" className="mx-auto max-w-xl p-10">
      {isMfaRequired(error) ? (
        <MfaRequiredNotice />
      ) : isPending || first ? (
        <LoadingBlock label="Ouverture de votre espace…" />
      ) : (
        <EmptyState icon="cadenas" title="Aucun espace de responsable">
          Votre compte n&apos;a pas encore de nomination. Le secrétariat de votre paroisse ou le diocèse l&apos;enregistre pour vous.
        </EmptyState>
      )}
    </main>
  );
};

export default EspaceIndexPage;
