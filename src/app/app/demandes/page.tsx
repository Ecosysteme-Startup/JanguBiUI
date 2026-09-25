import type { Metadata } from 'next';

import { RequestsList } from '@/features/actes/components/requests-list';

export const metadata: Metadata = { title: 'Mes demandes d’actes', robots: { index: false } };

const DemandesPage = () => <RequestsList />;

export default DemandesPage;
