'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { hrefOfContext } from '@/components/layouts/node-context-switcher';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useContexts } from '@/lib/can';

/** `/espace` : ouvre le premier contexte disponible (lien « Espace paroisse » du pied de page). */
const EspaceIndexPage = () => {
  const router = useRouter();
  const { contexts, isPending } = useContexts();
  const first = contexts[0];
  useEffect(() => {
    if (first) router.replace(hrefOfContext(first));
  }, [first, router]);
  return (
    <main id="contenu" className="mx-auto max-w-xl p-10">
      {isPending || first ? (
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
