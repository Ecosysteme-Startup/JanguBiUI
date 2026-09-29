import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MyDonations } from '@/features/dons/components/mes-dons/my-donations';

export const metadata: Metadata = { title: 'Mes dons', robots: { index: false } };

/** WEB-FID-Mes-Dons (`?annee=`). */
const MesDonsPage = () => (
  <Suspense>
    <MyDonations />
  </Suspense>
);

export default MesDonsPage;
