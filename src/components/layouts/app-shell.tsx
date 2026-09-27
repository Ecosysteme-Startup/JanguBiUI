'use client';

import { LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';

import { Link } from '@/components/ui/link/link';
import { buildNavItems, isNavActive } from '@/config/nav-config';
import { useLogout, useUser } from '@/lib/auth';
import { springs } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';
import { useMessagingStore } from '@/stores/messaging-store';

import { AppHeader } from './app-header';
import { BottomNav } from './bottom-nav';
import { NotificationBell } from './notification-bell';
import { OnboardingGuard } from './onboarding-guard';
import { PageMetaProvider, usePageMetaValue } from './page-meta';
import { ThemeToggle } from './theme-toggle';

interface AppShellProps {
  children: React.ReactNode;
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <rect x="10" y="2" width="4" height="20" rx="2" />
      <rect x="2" y="8" width="20" height="4" rx="2" />
    </svg>
  );
}

function DesktopSidebar({ messageBadge }: { messageBadge?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useUser();
  const { mutate: logout } = useLogout({
    onSuccess: () => router.replace('/auth/login'),
  });
  const navItems = buildNavItems(user);

  return (
    <aside className="hidden md:flex md:flex-col md:w-16 lg:w-56 md:shrink-0 md:border-r md:border-border md:bg-background/95 md:backdrop-blur-md md:sticky md:top-0 md:h-screen md:overflow-y-auto">
      {/* Logo / brand */}
      <div className="flex h-16 items-center justify-center lg:justify-start lg:px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CrossIcon className="size-4 text-primary" />
          </div>
          <span className="hidden lg:block font-serif text-base font-bold text-foreground tracking-tight">
            Jàngu Bi
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-0.5 py-4 px-2">
        {navItems.map((item) => {
          const isActive = isNavActive(pathname, item.href);
          const Icon = item.icon;
          const badge =
            item.label === 'Messages' && messageBadge && messageBadge > 0
              ? messageBadge
              : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                'lg:justify-start justify-center',
                isActive
                  ? 'bg-primary/12 text-primary shadow-soft-sm'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  aria-hidden
                  layoutId="sidebar-indicator"
                  transition={springs.indicator}
                  className="absolute left-0 top-[calc(50%-10px)] h-5 w-0.5 rounded-r-full bg-primary"
                />
              )}
              <span className="relative shrink-0">
                <Icon className="size-5" />
                {badge !== undefined && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Notifications + Theme + Logout */}
      <div className="shrink-0 border-t border-border p-2 flex flex-col gap-0.5">
        <NotificationBell className="w-full" />
        <ThemeToggle className="w-full lg:justify-start justify-center" />
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/70 hover:text-destructive lg:justify-start justify-center"
          aria-label="Se déconnecter"
        >
          <LogOut className="size-5 shrink-0" />
          <span className="hidden lg:block">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <OnboardingGuard>
      <PageMetaProvider>
        <AppShellLayout>{children}</AppShellLayout>
      </PageMetaProvider>
    </OnboardingGuard>
  );
}

function AppShellLayout({ children }: AppShellProps) {
  const totalUnread = useMessagingStore((s) => s.totalUnread);
  const meta = usePageMetaValue();

  return (
    <div className="flex min-h-dvh bg-background">
      <DesktopSidebar messageBadge={totalUnread} />
      <div className="flex flex-1 flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNav messageBadge={totalUnread} />
      </div>
      {/* Cloche flottante mobile — uniquement pour les pages NON migrées : les
          pages migrées affichent la cloche dans l'app-bar de AppHeader. */}
      {!meta && (
        <div className="fixed right-3 top-3 z-50 md:hidden">
          <NotificationBell className="size-10 rounded-full border border-border bg-background/90 shadow-sm backdrop-blur-sm p-0 justify-center" />
        </div>
      )}
    </div>
  );
}
