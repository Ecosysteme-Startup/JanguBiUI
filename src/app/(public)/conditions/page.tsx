import type { Metadata } from 'next';

import { TermsOfUse } from '@/features/legal/components/terms-of-use';

export const metadata: Metadata = {
  title: 'Conditions d’utilisation',
  description: 'Les conditions d’utilisation de Jàngu Bi, application des paroisses catholiques du Sénégal.',
};

const ConditionsPage = () => <TermsOfUse />;

export default ConditionsPage;
