import type { Metadata } from 'next';

import { EventView } from '@/features/paroisse/components/event-view';

export const metadata: Metadata = { title: 'Événement' };

const EvenementPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <EventView id={id} />;
};

export default EvenementPage;
