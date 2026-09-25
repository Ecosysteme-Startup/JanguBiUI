import type { ReactNode } from 'react';

import { LiturgyBannerSlot } from '@/components/layouts/liturgy-banner-slot';
import { PublicFooter } from '@/components/layouts/public-footer';
import { PublicHeader } from '@/components/layouts/public-header';
import { paths } from '@/config/paths';

/** Shell public : bandeau liturgique, en-tête, contenu, pied de page nuit. */
export const PublicShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-dvh flex-col bg-paper">
    <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:p-3">
      Aller au contenu
    </a>
    <LiturgyBannerSlot href={paths.parole.getHref()} className="px-4 md:px-16" />
    <PublicHeader />
    <main id="contenu" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-24 pt-16 md:px-16">
      {children}
    </main>
    <PublicFooter />
  </div>
);
