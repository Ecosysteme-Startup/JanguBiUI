'use client';

import { Suspense } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { SkeletonList } from '@/components/ui/skeleton';
import { Recherche } from '@/features/recherche/components/recherche';

export default function RecherchePage() {
  useRegisterPageMeta({ title: 'Recherche' });
  return (
    <ContentContainer>
      <Suspense fallback={<SkeletonList count={3} />}>
        <Recherche />
      </Suspense>
    </ContentContainer>
  );
}
