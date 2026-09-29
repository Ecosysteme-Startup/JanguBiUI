'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { IntentionsFidele } from '@/features/intentions/components/intentions-fidele';

export default function IntentionsPage() {
  useRegisterPageMeta({
    title: 'Intentions de messe',
    subtitle:
      'Demandez qu’une messe soit célébrée à une intention, et suivez vos demandes.',
  });
  return (
    <ContentContainer width="wide">
      <IntentionsFidele />
    </ContentContainer>
  );
}
