import type { Metadata } from 'next';

import { ParishOverview } from '@/features/paroisse/components/parish-overview';

export const metadata: Metadata = { title: 'Ma paroisse' };

const MaParoissePage = () => <ParishOverview />;

export default MaParoissePage;
