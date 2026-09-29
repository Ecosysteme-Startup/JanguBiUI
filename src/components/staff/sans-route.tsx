'use client';

import { Clock } from 'lucide-react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { EmptyState } from '@/components/ui/empty-state';
import {
  type Fonctionnalite,
  fonctionnaliteActive,
} from '@/config/fonctionnalites';

function Indisponible({ titre }: { titre?: string }) {
  useRegisterPageMeta({ title: titre ?? 'Bientôt disponible' });
  return (
    <ContentContainer>
      <EmptyState
        icon={<Clock />}
        title="Bientôt disponible"
        description="Cet espace sera ouvert prochainement."
      />
    </ContentContainer>
  );
}

/**
 * Écran hérité dont la route backend V1 n'existe pas encore
 * (`config/fonctionnalites.ts`) : tant que l'indicateur est éteint, rien n'est
 * appelé et un état sobre s'affiche à la place.
 */
export function SansRoute({
  cle,
  titre,
  children,
}: {
  cle: Fonctionnalite;
  titre?: string;
  children: React.ReactNode;
}) {
  if (fonctionnaliteActive(cle)) return <>{children}</>;
  return <Indisponible titre={titre} />;
}
