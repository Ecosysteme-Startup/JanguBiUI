import type { Metadata } from 'next';

import { ConfessionView } from './_components/confession-view';

export const metadata: Metadata = { title: 'Rendez-vous de confession', robots: { index: false } };

const ConfessionPage = () => <ConfessionView />;

export default ConfessionPage;
