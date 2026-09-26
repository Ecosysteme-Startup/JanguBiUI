'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { NavDrawer } from '@/components/layouts/nav-drawer';
import { TopbarEndTarget, TopbarSlotTargets, useShellSlots } from '@/components/layouts/shell-slots';
import { Icon } from '@/components/ui/icon';
import { iconButtonClasses, UnreadDot } from '@/components/ui/icon-button';
import { paths } from '@/config/paths';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { cn } from '@/utils/cn';

const SkipLink = () => (
  <a
    href="#contenu"
    className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-10 focus:bg-paper focus:p-3"
  >
    Aller au contenu
  </a>
);

/** Cloche des notifications (40 px, rayon 10) avec pastille b600 quand il reste du non-lu. */
export const NotificationBell = ({ href = paths.app.notifications.getHref() }: { href?: string }) => {
  const { data: unread = 0 } = useUnreadNotifications();
  return (
    <NextLink
      href={href}
      aria-label={unread ? `Notifications, ${unread} non lue${unread > 1 ? 's' : ''}` : 'Notifications'}
      className={cn(iconButtonClasses(), 'relative')}
    >
      <Icon name="cloche" size={20} />
      {unread > 0 && <UnreadDot />}
    </NextLink>
  );
};

type AppFrameProps = {
  /** Contenu de la barre latérale (colonne de 264 px à partir de lg, tiroir « Menu » en dessous). */
  sidebar: ReactNode;
  /** Texte de gauche de la barre supérieure quand la page n'en fournit pas (date, « Nœud · Parent »). */
  topbarFallback: ReactNode;
  /** Barre du bas (mobile, espace fidèle). */
  bottomNav?: ReactNode;
  children: ReactNode;
};

/**
 * Cadre des espaces connectés (WEB-FID-*, WEB-PAR-*, WEB-DIO-*, WEB-PLA-*) : barre latérale 264 px
 * (fond surface, filet line), barre supérieure 64 px (padding 0 40, filet bas), puis <main>
 * padding 32/40/48, largeur 1120 max. Les pages remplissent la barre par <TopbarContent> et passent
 * en plein cadre par <ShellLayout fullBleed hideTopbar> (shell-slots.tsx).
 */
export const AppFrame = ({ sidebar, topbarFallback, bottomNav, children }: AppFrameProps) => {
  const fullBleed = useShellSlots((s) => s.fullBleed > 0);
  const hideTopbar = useShellSlots((s) => s.hideTopbar > 0);
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <SkipLink />
      {/* À l'impression (feuille d'annonces…), seul le contenu de la page sort. */}
      <aside className="hidden border-r border-line bg-surface print:hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto">
        {sidebar}
      </aside>
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header
          className={cn(
            'flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line px-4 print:hidden lg:px-10',
            hideTopbar && 'lg:hidden',
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <NavDrawer>{sidebar}</NavDrawer>
            <TopbarSlotTargets fallback={topbarFallback} />
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <TopbarEndTarget />
            <NotificationBell />
          </div>
        </header>
        <main
          id="contenu"
          className={cn(
            'min-w-0 flex-1',
            fullBleed
              ? cn('h-[calc(100dvh-64px)] overflow-hidden', hideTopbar && 'lg:h-dvh')
              : 'w-full max-w-content px-4 pb-24 pt-6 lg:px-10 lg:pb-12 lg:pt-8 print:p-0',
          )}
        >
          {children}
        </main>
      </div>
      {bottomNav}
    </div>
  );
};

/** Date du jour en toutes lettres (« Jeudi 24 septembre 2026 »), texte par défaut de la barre fidèle. */
export const TopbarText = ({ children }: { children: ReactNode }) => (
  <span suppressHydrationWarning className="truncate text-14 text-ink-3">
    {children}
  </span>
);
