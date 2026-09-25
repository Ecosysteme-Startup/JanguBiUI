'use client';

import NextLink from 'next/link';

import { NavLink } from '@/components/layouts/nav-link';
import { SignOutButton } from '@/components/layouts/sign-out-button';
import { Icon } from '@/components/ui/icon';
import { FIDELE_NAV } from '@/config/nav';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';

const top =
  'flex h-10 items-center gap-3 rounded px-3 text-base text-ink-2 hover:bg-surface-2 hover:text-ink';
const topActive = 'bg-surface-2 font-semibold text-primary hover:text-primary';
const sub = 'flex h-9 items-center gap-2.5 pl-[30px] text-sm text-ink-2 hover:text-primary';
const subActive = 'text-primary';

/** Sidebar de l'espace fidèle (FID-Accueil, 264 px). */
export const FideleSidebar = () => {
  const { data: me } = useMe();
  const paroisse = me?.paroisse_suivie;
  return (
    <aside className="hidden w-66 shrink-0 flex-col border-r border-line px-4 py-6 lg:flex">
      <nav aria-label="Espace fidèle" className="flex flex-col gap-2">
        {FIDELE_NAV.map((item) => (
          <div key={item.href}>
            <NavLink href={item.href} match={item.match} className={top} activeClassName={topActive}>
              {item.icon && <Icon name={item.icon} size={20} />}
              {item.label}
            </NavLink>
            {item.children?.map((child) => (
              <NavLink key={child.label} href={child.href} match={child.match} className={sub} activeClassName={subActive}>
                <span aria-hidden="true" className="size-1 rounded-full" />
                {child.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-4 border-t border-line pt-5">
        {paroisse ? (
          <div>
            <p className="tnum m-0 text-meta text-ink-3">Paroisse suivie</p>
            <p className="m-0 mt-1 font-serif text-h4 text-ink">{paroisse.name}</p>
            <NextLink href={paths.app.paroisse.root.getHref()} className="mt-2 inline-block text-sm">
              Horaires et annonces
            </NextLink>
          </div>
        ) : (
          me && (
            <NextLink href={paths.auth.bienvenue.getHref()} className="text-sm">
              Choisir ma paroisse
            </NextLink>
          )
        )}
        <SignOutButton />
      </div>
    </aside>
  );
};
