import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RechercheVue } from '@/features/sonotheque/components/recherche-vue';

export const metadata: Metadata = {
  title: 'Rechercher un enregistrement',
  robots: { index: false },
};

const RechercheAudioPage = () => (
  <Suspense>
    <RechercheVue />
  </Suspense>
);

export default RechercheAudioPage;
