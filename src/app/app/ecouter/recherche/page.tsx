'use client';

import { Suspense } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { RechercheVue } from '@/features/sonotheque/components/recherche-vue';

export default function RecherchePage() {
  return (
    <ContentContainer width="wide">
      <Suspense>
        <RechercheVue />
      </Suspense>
    </ContentContainer>
  );
}
