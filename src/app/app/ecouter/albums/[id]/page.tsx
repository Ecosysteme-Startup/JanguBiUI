import type { Metadata } from 'next';

import { AlbumVue } from '@/features/sonotheque/components/album-vue';

export const metadata: Metadata = { title: 'Album', robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

const AlbumPage = async ({ params }: Props) => (
  <AlbumVue albumId={decodeURIComponent((await params).id)} />
);

export default AlbumPage;
