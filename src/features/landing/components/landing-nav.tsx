'use client';

import { Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="none" aria-hidden>
    <rect x="12.5" y="2" width="5" height="26" rx="2.5" fill="currentColor" />
    <rect x="3" y="9.5" width="24" height="5" rx="2.5" fill="currentColor" />
    <circle cx="15" cy="12" r="3" fill="hsl(var(--background))" />
  </svg>
);

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: user, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 py-4">
        {/* Fond qui apparaît au défilement : seule l'opacité d'un calque est
            animée (300 ms, out-cubic) — plus de transition sur le padding,
            donc ni relayout ni saut de contenu. */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 bg-background/90 shadow-sm backdrop-blur-xl transition-opacity duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none',
            scrolled ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div className="relative mx-auto max-w-[1180px] px-5 sm:px-10">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <a
              href="#"
              className="flex items-center gap-2 font-serif text-xl font-semibold text-primary"
            >
              <LogoMark />
              <span className="text-foreground">Jàngu Bi</span>
            </a>

            {/* Desktop nav */}
            <ul className="hidden items-center gap-7 list-none md:flex">
              {[
                ['Fonctionnalités', '#features'],
                ['Paroisses', '#pour-qui'],
                ['Témoignages', '#testimonials'],
              ].map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-sm font-medium text-foreground/50 transition-colors hover:text-foreground"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Desktop CTAs */}
            <div className="hidden items-center gap-2 md:flex">
              {!mounted || isUserLoading ? (
                <div className="h-8 w-[180px]" aria-hidden />
              ) : user ? (
                <Button size="sm" asChild>
                  <Link href={paths.app.root.getHref()}>Tableau de bord</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={paths.auth.login.getHref()}>Se connecter</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={paths.auth.register.getHref()}>
                      Créer un compte
                    </Link>
                  </Button>
                </>
              )}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="ml-1 flex size-8 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                  aria-label="Changer le thème"
                >
                  {theme === 'dark' ? (
                    <Moon className="size-4" />
                  ) : (
                    <Sun className="size-4" />
                  )}
                </button>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="flex size-9 flex-col items-center justify-center gap-1.5 rounded-md md:hidden"
              onClick={() => setDrawerOpen((o) => !o)}
              aria-label="Menu"
            >
              {drawerOpen ? (
                <X className="size-5 text-foreground/70" />
              ) : (
                <Menu className="size-5 text-foreground/70" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 pt-[70px]">
          <button
            className="absolute inset-0 cursor-default bg-background/97 backdrop-blur-xl"
            onClick={closeDrawer}
            aria-label="Fermer le menu"
          />
          <div className="relative z-10 flex flex-col gap-5 px-5 pt-8">
            {[
              ['Fonctionnalités', '#features'],
              ['Paroisses', '#pour-qui'],
              ['Témoignages', '#testimonials'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={closeDrawer}
                className="border-b border-border pb-5 text-xl font-medium text-foreground/60 transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              {!mounted || isUserLoading ? (
                <div
                  className="h-10 w-full rounded-md bg-muted/40 animate-pulse"
                  aria-hidden
                />
              ) : user ? (
                <Button asChild className="w-full">
                  <Link href={paths.app.root.getHref()} onClick={closeDrawer}>
                    Tableau de bord
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link
                      href={paths.auth.login.getHref()}
                      onClick={closeDrawer}
                    >
                      Se connecter
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link
                      href={paths.auth.register.getHref()}
                      onClick={closeDrawer}
                    >
                      Créer un compte
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
