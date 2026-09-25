'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { isActivePath } from '@/components/layouts/nav-link';
import { ThemeToggle } from '@/components/layouts/theme-toggle';
import type { BackofficeGroup } from '@/config/nav';
import { paths } from '@/config/paths';

type Props = { rootLabel: string; rootHref: string; groups: BackofficeGroup[] };

/** Fil d'Ariane + accès à l'espace fidèle (PAR-Tableau-de-bord). */
export const BackofficeTopbar = ({ rootLabel, rootHref, groups }: Props) => {
  const pathname = usePathname() ?? '/';
  const items = groups.flatMap((g) => g.items);
  const current =
    items.find((i) => i.match === 'exact' && isActivePath(pathname, i.href, 'exact')) ??
    items.filter((i) => i.match !== 'exact' && isActivePath(pathname, i.href)).at(0);
  const isRoot = pathname === rootHref;
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2 lg:px-8">
      <nav aria-label="Fil d’Ariane" className="text-sm">
        <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
          <li>
            <NextLink href={rootHref} className="text-ink-2 hover:text-primary">
              {rootLabel}
            </NextLink>
          </li>
          <li aria-hidden="true" className="text-ink-3">
            /
          </li>
          <li aria-current="page" className="font-medium text-ink">
            {isRoot ? 'Tableau de bord' : (current?.label ?? 'Page')}
          </li>
        </ol>
      </nav>
      <div className="flex items-center gap-5">
        <ThemeToggle />
        <NextLink href={paths.app.root.getHref()} className="text-sm">
          Voir l&apos;espace fidèle
        </NextLink>
      </div>
    </div>
  );
};
