import type { Metadata } from 'next';

import { MaParoisse } from './_components/ma-paroisse';

export const metadata: Metadata = { title: 'Ma paroisse' };

const MaParoissePage = () => <MaParoisse />;

export default MaParoissePage;
