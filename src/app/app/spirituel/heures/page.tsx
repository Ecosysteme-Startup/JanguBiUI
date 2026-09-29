'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { HeuresTab } from '@/features/bible/components/heures-tab';

export default function LiturgieHeuresPage() {
  useRegisterPageMeta({
    title: 'Liturgie des Heures',
    subtitle: 'Les 7 offices de la prière quotidienne',
  });

  return (
    <div className="flex flex-col">
      <ContentContainer>
        <HeuresTab />
      </ContentContainer>
    </div>
  );
}
