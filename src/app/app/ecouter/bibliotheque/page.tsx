'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { BibliothequeVue } from '@/features/sonotheque/components/bibliotheque-vue';

export default function BibliothequePage() {
  return (
    <ContentContainer width="wide">
      <BibliothequeVue />
    </ContentContainer>
  );
}
