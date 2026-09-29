'use client';

import { use } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { PlaylistVue } from '@/features/sonotheque/components/playlist-vue';

export default function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ContentContainer width="wide">
      <PlaylistVue playlistId={id} />
    </ContentContainer>
  );
}
