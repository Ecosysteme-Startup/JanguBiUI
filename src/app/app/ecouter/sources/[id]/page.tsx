'use client';

import { use } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { SourceVue } from '@/features/sonotheque/components/source-vue';

export default function SourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ContentContainer width="wide">
      <SourceVue sourceId={id} />
    </ContentContainer>
  );
}
