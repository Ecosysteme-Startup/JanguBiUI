import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHeader } from '@/components/ui/page-header';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Recherche } from '@/features/recherche/components/recherche';

export const metadata: Metadata = {
  title: 'Recherche',
  robots: { index: false },
};

/** Recherche transverse : Bible, paroisses, annonces, prêtres joignables, écoute, lieux. */
const RecherchePage = () => (
  <div className="flex flex-col gap-6">
    <PageHeader title="Recherche" />
    <Suspense fallback={<LoadingBlock />}>
      <Recherche />
    </Suspense>
  </div>
);

export default RecherchePage;
