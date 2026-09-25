import type { Metadata } from 'next';

import { PrivacyPolicy } from '@/features/legal/components/privacy-policy';

export const metadata: Metadata = {
  title: 'Confidentialité',
  description: 'Comment Jàngu Bi traite vos données personnelles, conformément à la loi n° 2008-12.',
};

const ConfidentialitePage = () => <PrivacyPolicy />;

export default ConfidentialitePage;
