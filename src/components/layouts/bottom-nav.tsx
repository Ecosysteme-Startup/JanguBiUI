'use client';

import { MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer/drawer';
import { Link } from '@/components/ui/link/link';
import {
  buildBottomNavItems,
  buildOverflowNavItems,
  isNavActive,
} from '@/config/nav-config';
import { useUser } from '@/lib/auth';
import { springs } from '@/lib/motion/tokens';
import { cn } from '@/utils/cn';

interface BottomNavProps {
  messageBadge?: number;
}

export function BottomNav({ messageBadge }: BottomNavProps) {
  const pathname = usePathname();
  const { data: user } = useUser();
  const navItems = buildBottomNavItems(user);
  const overflow = buildOverflowNavItems(user);
  const [moreOpen, setMoreOpen] = useState(false);
  const overflowActive = overflow.some((i) => isNavActive(pathname, i.href));

  return (
    <nav
      role="navigation"
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex h-[60px] max-w-lg items-center justify-around px-1">
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
              className={cn(
                'relative flex flex-1 min-w-0 flex-col items-center gap-0.5 px-1 py-1.5 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={cn(
                  'relative flex size-10 items-center justify-center rounded-full',
                )}
              >
                {/* Pastille active : glisse d'un onglet à l'autre avec le
                    ressort de la barre d'onglets mobile. */}
                {isActive && (
                  <motion.span
                    aria-hidden
                    layoutId="bottom-nav-pill"
                    transition={springs.indicator}
                    className="absolute inset-0 rounded-full bg-primary/12"
                  />
                )}
                <Icon className="relative size-5" />
                {badge !== undefined && (
                  <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'max-w-full truncate text-[10px] transition-all',
                  isActive ? 'font-semibold' : 'font-medium',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* « Plus » — items sidebar non présents dans la bottom-nav (fidèle) */}
        {overflow.length > 0 && (
          <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-label="Menu"
              className={cn(
                'relative flex flex-1 min-w-0 flex-col items-center gap-0.5 px-1 py-1.5 transition-colors',
                overflowActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-full transition-all duration-200',
                  overflowActive ? 'bg-primary/12 scale-105' : 'bg-transparent',
                )}
              >
                <MoreHorizontal className="size-5" />
              </span>
              <span
                className={cn(
                  'max-w-full truncate text-[10px]',
                  overflowActive ? 'font-semibold' : 'font-medium',
                )}
              >
                Menu
              </span>
            </button>
            <DrawerContent
              side="bottom"
              className="rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <DrawerHeader className="px-0 text-left">
                <DrawerTitle className="font-serif">Menu</DrawerTitle>
              </DrawerHeader>
              <div className="grid grid-cols-3 gap-2.5">
                {overflow.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
                        active
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <Icon className="size-6" />
                      <span className="text-xs font-medium text-foreground">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
