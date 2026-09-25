import type { Metadata } from 'next';

import { BibleHome } from '@/features/bible/components/bible-home';

export const metadata: Metadata = { title: 'Bible' };

const BiblePage = () => <BibleHome />;

export default BiblePage;
