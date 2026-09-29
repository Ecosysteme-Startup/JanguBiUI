'use client';

import { use } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { AlbumVue } from '@/features/sonotheque/components/album-vue';

export default function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ContentContainer width="wide">
      <AlbumVue albumId={id} />
    </ContentContainer>
  );
}
