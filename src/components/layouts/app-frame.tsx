'use client';

import NextLink from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';

import { NavDrawer } from '@/components/layouts/nav-drawer';
import { RealtimeBridge } from '@/components/layouts/realtime-bridge';
import { TopbarEndTarget, TopbarSlotTargets, useShellSlots } from '@/components/layouts/shell-slots';
import { Icon } from '@/components/ui/icon';
import { iconButtonClasses, UnreadDot } from '@/components/ui/icon-button';
import { Logo } from '@/components/ui/logo';
import { paths } from '@/config/paths';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { cn } from '@/utils/cn';
import { longDate } from '@/utils/dates';

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
  /** Accueil de l'espace : sous 1024 px, le logo de la barre supérieure y mène (la barre latérale est repliée). */
  homeHref?: string;
  children: ReactNode;
};

/**
 * Cadre des espaces connectés (WEB-FID-*, WEB-PAR-*, WEB-DIO-*, WEB-PLA-*) : barre latérale 264 px
 * (fond surface, filet line), barre supérieure 64 px (padding 0 40, filet bas), puis <main>
 * padding 32/40/48, largeur 1120 max. Les pages remplissent la barre par <TopbarContent> et passent
 * en plein cadre par <ShellLayout fullBleed hideTopbar> (shell-slots.tsx).
 */
export const AppFrame = ({ sidebar, topbarFallback, bottomNav, homeHref, children }: AppFrameProps) => {
  const fullBleed = useShellSlots((s) => s.fullBleed > 0);
  const hideTopbar = useShellSlots((s) => s.hideTopbar > 0);
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Socket ws/notifications/ unique de l'onglet (cloche, présence, lecteur). */}
      <RealtimeBridge />
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
            {homeHref && (
              <NextLink href={homeHref} aria-label="Jàngu Bi, accueil de l’espace" className="hit inline-flex shrink-0 items-center lg:hidden">
                <Logo size={26} decorative />
              </NextLink>
            )}
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
            'min-w-0',
            fullBleed
              ? // Hauteur fixe (pas de flex-1, qui l'écraserait) : les colonnes ont leur propre défilement.
                cn('shrink-0 overflow-hidden', bottomNav ? 'jb-fullbleed-with-bottom-nav' : 'jb-fullbleed', hideTopbar && 'jb-fullbleed-no-topbar')
              : 'w-full max-w-content flex-1 px-4 pb-24 pt-6 lg:px-10 lg:pb-12 lg:pt-8 print:p-0',
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

/**
 * Date du jour recalculée côté client après montage : le segment fidèle est servi en cache
 * statique (x-nextjs-cache HIT), figeant la date du rendu serveur. On repart de la valeur rendue
 * côté serveur (hydratation sans saut), puis on la remplace par la date réelle du navigateur.
 * Aucune donnée personnelle ici : le cache reste partageable.
 */
export const TodayDate = () => {
  const [date, setDate] = useState(() => longDate(new Date()));
  useEffect(() => setDate(longDate(new Date())), []);
  return <TopbarText>{date}</TopbarText>;
};
