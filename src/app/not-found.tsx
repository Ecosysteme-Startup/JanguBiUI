import type { Metadata } from 'next';

import { NotFoundScreen } from '@/components/errors/not-found-screen';
import { PublicShell } from '@/components/layouts/public-shell';

export const metadata: Metadata = { title: 'Page introuvable', robots: { index: false } };

/** 404 (WEB-Erreur-404) : dans la coquille publique, quel que soit l'espace d'origine. */
const NotFound = () => (
  <PublicShell>
    <NotFoundScreen />
  </PublicShell>
);

export default NotFound;
