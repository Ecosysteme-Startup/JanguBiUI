'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { EcouterAccueil } from '@/features/sonotheque/components/ecouter-accueil';

export default function EcouterPage() {
  useRegisterPageMeta({ title: 'Écouter', showHeading: false });
  return (
    <ContentContainer width="wide">
      <EcouterAccueil />
    </ContentContainer>
  );
}
