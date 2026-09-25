import { NavLink } from '@/components/layouts/nav-link';
import { Icon } from '@/components/ui/icon';
import { MOBILE_TABS } from '@/config/nav';

/** Barre de navigation mobile (MOB-Accueil) : cinq entrées, cibles de 56 px. */
export const BottomNav = () => (
  <nav
    aria-label="Navigation principale"
    className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line-strong bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
  >
    {MOBILE_TABS.map((tab) => (
      <NavLink
        key={tab.href}
        href={tab.href}
        match={tab.match}
        className="flex h-14 flex-col items-center justify-center gap-1 text-meta text-ink-3"
        activeClassName="font-semibold text-primary"
      >
        {tab.icon && <Icon name={tab.icon} size={22} />}
        {tab.label}
      </NavLink>
    ))}
  </nav>
);
