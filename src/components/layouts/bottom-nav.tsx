import { NavLink } from '@/components/layouts/nav-link';
import { Icon } from '@/components/ui/icon';
import { MOBILE_TABS } from '@/config/nav';

/** Barre de navigation mobile de l'espace fidèle (sous 1024 px) : cinq entrées, cibles de 56 px. */
export const BottomNav = () => (
  <nav
    aria-label="Navigation principale"
    className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] print:hidden lg:hidden"
  >
    {MOBILE_TABS.map((tab) => (
      <NavLink
        key={tab.href}
        href={tab.href}
        match={tab.match}
        className="flex h-14 flex-col items-center justify-center gap-1 text-12 font-medium text-ink-3 hover:text-ink"
        activeClassName="font-semibold text-primary hover:text-primary"
      >
        {tab.icon && <Icon name={tab.icon} size={22} />}
        {tab.label}
      </NavLink>
    ))}
  </nav>
);
