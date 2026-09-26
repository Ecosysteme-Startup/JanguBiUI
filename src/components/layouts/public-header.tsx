import NextLink from 'next/link';

import { Brand } from '@/components/layouts/brand';
import { NavLink } from '@/components/layouts/nav-link';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';

const LINKS = [
  { label: 'La Parole du jour', href: paths.parole.getHref() },
  { label: 'Trouver une paroisse', href: paths.paroisses.list.getHref() },
  { label: 'Pour les paroisses', href: paths.pourLesParoisses.getHref() },
];

/** En-tête public (Main) : marque, trois liens, connexion et inscription. */
export const PublicHeader = () => (
  <header className="border-b border-line">
    <div className="mx-auto flex min-h-20 max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 md:px-16">
      <Brand href={paths.home.getHref()} label="Jàngu Bi, page d’accueil" subtitle="La Leçon" size="lg" />
      <nav aria-label="Navigation principale" className="order-3 flex w-full flex-wrap gap-x-9 gap-y-2 text-base lg:order-none lg:w-auto">
        {LINKS.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            className="py-2 text-ink hover:text-primary"
            activeClassName="text-primary underline decoration-1 underline-offset-8"
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <NextLink href={paths.auth.connexion.getHref()} className="hit text-base font-medium text-ink hover:text-primary">
          Se connecter
        </NextLink>
        <Button asChild size="md">
          <NextLink href={paths.auth.inscription.getHref()}>
            Créer mon compte <Icon name="fleche-droite" size={16} />
          </NextLink>
        </Button>
      </div>
    </div>
  </header>
);
