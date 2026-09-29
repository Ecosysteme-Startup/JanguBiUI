import type { Metadata } from 'next';

import { BibliothequeVue } from '@/features/sonotheque/components/bibliotheque-vue';

export const metadata: Metadata = {
  title: 'Ma bibliothèque',
  robots: { index: false },
};

const BibliothequePage = () => <BibliothequeVue />;

export default BibliothequePage;
