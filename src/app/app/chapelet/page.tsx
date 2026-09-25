import type { Metadata } from 'next';

import { ChapeletView } from '@/features/chapelet/components/chapelet-view';

export const metadata: Metadata = { title: 'Chapelet' };

const ChapeletPage = () => <ChapeletView />;

export default ChapeletPage;
