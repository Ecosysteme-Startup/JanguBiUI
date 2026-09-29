import type { ReactNode } from 'react';

import { PublicFooter } from '@/components/layouts/public-footer';
import { PublicHeader } from '@/components/layouts/public-header';

/**
 * Coquille publique (WEB-Accueil, WEB-Erreur-404) : en-tête 72 px, <main> pleine largeur SANS
 * padding (chaque page pose son conteneur `jb-container` et ses bandes pleine largeur), pied de page.
 */
export const PublicShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-dvh flex-col bg-paper">
    <a
      href="#contenu"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-10 focus:bg-paper focus:p-3"
    >
      Aller au contenu
    </a>
    <PublicHeader />
    <main id="contenu" className="flex-1">
      {children}
    </main>
    <PublicFooter />
  </div>
);
