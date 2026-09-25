import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { BottomNav } from '@/components/layouts/bottom-nav';
import { FideleHeader } from '@/components/layouts/fidele-header';
import { FideleSidebar } from '@/components/layouts/fidele-sidebar';
import { LiturgyBannerSlot } from '@/components/layouts/liturgy-banner-slot';
import { MobileMenu } from '@/components/layouts/mobile-menu';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';

/**
 * Shell de l'espace fidèle. Desktop (≥ lg) : en-tête, bandeau, sidebar de 264 px (FID-*).
 * Mobile : en-tête compact, bandeau abrégé, barre de cinq entrées + menu « Plus » (MOB-*).
 */
export const FideleShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-dvh flex-col bg-paper">
    <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:p-3">
      Aller au contenu
    </a>
    <FideleHeader />
    <header className="flex h-14 items-center justify-between border-b border-line px-2 pl-4 lg:hidden">
      <NextLink href={paths.app.root.getHref()} aria-label="Jàngu Bi, accueil" className="font-serif text-[24px] leading-none text-ink">
        Jàngu Bi
      </NextLink>
      <span className="flex items-center">
        <NextLink
          href={paths.app.notifications.getHref()}
          aria-label="Notifications"
          className="inline-flex size-11 items-center justify-center rounded text-ink hover:bg-surface-2"
        >
          <Icon name="cloche" size={22} />
        </NextLink>
        <MobileMenu />
      </span>
    </header>
    <LiturgyBannerSlot href={paths.app.parole.getHref()} className="hidden px-8 lg:flex" />
    <LiturgyBannerSlot href={paths.app.parole.getHref()} variant="mobile" className="lg:hidden" />
    <div className="flex flex-1">
      <FideleSidebar />
      <main id="contenu" className="min-w-0 flex-1 px-4 pb-24 pt-6 lg:px-12 lg:pb-16 lg:pt-10">
        {children}
      </main>
    </div>
    <BottomNav />
  </div>
);
