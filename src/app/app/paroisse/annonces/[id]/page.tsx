import type { Metadata } from 'next';

import { AnnouncementView } from '@/features/paroisse/components/announcement-view';

export const metadata: Metadata = { title: 'Annonce' };

const AnnoncePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <AnnouncementView id={id} />;
};

export default AnnoncePage;
