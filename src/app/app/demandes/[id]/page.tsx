import type { Metadata } from 'next';

import { RequestTracking } from '@/features/actes/components/request-tracking';

export const metadata: Metadata = { title: 'Suivi de ma demande', robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

const DemandeSuiviPage = async ({ params }: Props) => {
  const { id } = await params;
  return <RequestTracking id={decodeURIComponent(id)} />;
};

export default DemandeSuiviPage;
