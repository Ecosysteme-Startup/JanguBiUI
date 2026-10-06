import type { Metadata } from 'next';

import { PretresView } from './_components/pretres-view';

export const metadata: Metadata = { title: 'Parler à un prêtre', robots: { index: false } };

const PretresPage = () => <PretresView />;

export default PretresPage;
