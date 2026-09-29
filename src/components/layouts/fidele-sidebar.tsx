'use client';

import NextLink from 'next/link';

import { Brand } from '@/components/layouts/brand';
import { QuickSearch, type QuickSearchItem } from '@/components/layouts/quick-search';
import { SidebarFrame, SidebarLink } from '@/components/layouts/sidebar-nav';
import { UserMenu } from '@/components/layouts/user-menu';
import { Avatar } from '@/components/ui/avatar';
import { FIDELE_ALIASES, FIDELE_NAV } from '@/config/nav';
import { paths } from '@/config/paths';
import { displayName, useMe } from '@/hooks/use-me';

/** Destinations de la recherche rapide : rubriques, sous-rubriques, notifications, profil. */
const SEARCH_ITEMS: QuickSearchItem[] = [
  ...FIDELE_NAV.flatMap((item) => [
    { label: item.label, href: item.href, icon: item.icon },
    ...(item.children ?? [])
      .filter((child) => child.href !== item.href)
      .map((child) => ({ label: child.label, href: child.href, icon: item.icon, group: item.label })),
  ]),
  { label: 'Nouvelle demande d’acte', href: paths.app.demandes.nouvelle.getHref(), icon: 'plus', group: 'Mes demandes' },
  { label: 'Notifications', href: paths.app.notifications.getHref(), icon: 'cloche' },
  { label: 'Profil et réglages', href: paths.app.profil.getHref(), icon: 'profil' },
];

/**
 * Barre latérale de l'espace fidèle (WEB-FID-*) : logotype, recherche Ctrl K, cinq rubriques,
 * carte « Paroisse suivie », carte utilisateur avec le menu du compte.
 */
export const FideleSidebar = () => {
  const { data: me } = useMe();
  const paroisse = me?.paroisse_suivie;
  const name = displayName(me);
  return (
    <SidebarFrame>
      <Brand href={paths.app.root.getHref()} label="Jàngu Bi, accueil de mon espace" size="sm" className="h-10 px-2" />
      <div className="mt-4">
        <QuickSearch items={SEARCH_ITEMS} searchAll={paths.app.recherche.getHref} />
      </div>
      <nav aria-label="Espace fidèle" className="mt-5 flex flex-col gap-0.5">
        {FIDELE_NAV.map((item) => (
          <SidebarLink key={item.href} href={item.href} label={item.label} icon={item.icon} match={item.match} aliases={FIDELE_ALIASES[item.href]} />
        ))}
      </nav>
      <div className="min-h-6 flex-1" />
      {paroisse ? (
        <NextLink
          href={paths.app.paroisse.root.getHref()}
          className="flex flex-col gap-0.5 rounded-12 border border-line bg-paper px-3.5 py-3 text-ink transition-colors hover:border-line-active hover:text-ink"
        >
          <span className="text-12 text-ink-3">Paroisse suivie</span>
          <span className="text-15 font-semibold">{paroisse.name}</span>
          <span className="text-13 text-ink-2">Horaires, annonces et agenda</span>
        </NextLink>
      ) : (
        me && (
          <NextLink
            href={paths.auth.bienvenue.getHref()}
            className="flex flex-col gap-0.5 rounded-12 border border-line bg-paper px-3.5 py-3 text-ink hover:border-line-active hover:text-ink"
          >
            <span className="text-12 text-ink-3">Paroisse suivie</span>
            <span className="text-15 font-semibold text-primary">Choisir ma paroisse</span>
          </NextLink>
        )
      )}
      {me && (
        <div className="mt-3 flex items-center gap-2.5 px-1">
          <Avatar name={name.full || '?'} size={32} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-14 font-semibold text-ink">{name.full}</span>
            <span className="truncate text-12 text-ink-3">{me.email}</span>
          </span>
          <UserMenu />
        </div>
      )}
    </SidebarFrame>
  );
};
