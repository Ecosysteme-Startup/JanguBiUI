import type { Metadata } from 'next';

import { CampaignPage } from '@/features/dons/components/campagne/campaign-page';

export const metadata: Metadata = { title: 'Campagne', robots: { index: false } };

type Props = { params: Promise<{ fundId: string }> };

/** WEB-FID-Campagne. */
const CampagnePage = async ({ params }: Props) => {
  const { fundId } = await params;
  return <CampaignPage fundId={decodeURIComponent(fundId)} />;
};

export default CampagnePage;
