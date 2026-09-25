import type { Metadata } from 'next';

import { RequestWizard } from '@/features/actes/components/request-wizard';

export const metadata: Metadata = { title: 'Nouvelle demande d’acte', robots: { index: false } };

const NouvelleDemandePage = () => <RequestWizard />;

export default NouvelleDemandePage;
