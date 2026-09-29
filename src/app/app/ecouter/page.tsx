import type { Metadata } from 'next';

import { EcouterAccueil } from '@/features/sonotheque/components/ecouter-accueil';

export const metadata: Metadata = {
  title: 'Écouter',
  robots: { index: false },
};

/** Sonothèque : accueil « Écouter » (messes, homélies, chants de la paroisse). */
const EcouterPage = () => <EcouterAccueil />;

export default EcouterPage;
