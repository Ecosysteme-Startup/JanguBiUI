import type { Metadata } from 'next';

import { PlaylistVue } from '@/features/sonotheque/components/playlist-vue';

export const metadata: Metadata = {
  title: 'Playlist',
  robots: { index: false },
};

type Props = { params: Promise<{ id: string }> };

const PlaylistPage = async ({ params }: Props) => (
  <PlaylistVue playlistId={decodeURIComponent((await params).id)} />
);

export default PlaylistPage;
