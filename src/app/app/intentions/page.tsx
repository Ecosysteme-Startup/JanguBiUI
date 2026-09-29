import type { Metadata } from 'next';

import { PageHeader } from '@/components/ui/page-header';
import { IntentionsFidele } from '@/features/intentions/components/intentions-fidele';

export const metadata: Metadata = {
  title: 'Intentions de messe',
  robots: { index: false },
};

/** Intentions de messe du fidèle : demander, suivre, annuler. Aucune offrande n'est reçue ici. */
const IntentionsPage = () => (
  <div className="flex flex-col gap-6">
    <PageHeader
      title="Intentions de messe"
      description="Demandez qu’une messe soit célébrée à une intention, et suivez vos demandes."
    />
    <IntentionsFidele />
  </div>
);

export default IntentionsPage;
