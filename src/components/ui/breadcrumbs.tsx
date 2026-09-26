import NextLink from 'next/link';

import { cn } from '@/utils/cn';

import { Icon } from './icon';

export type Crumb = { label: string; href?: string };

/**
 * Fil d'Ariane (WEB-Design-System ; barre supérieure des écrans de détail) : liens 14 ink2,
 * chevron ink3, page courante en ink 600. `separator="slash"` pour la variante « Annonces / Nouvelle annonce ».
 */
export const Breadcrumbs = ({ items, separator = 'chevron', className }: { items: Crumb[]; separator?: 'chevron' | 'slash'; className?: string }) => (
  <nav aria-label="Fil d’Ariane" className={cn('min-w-0 text-14', className)}>
    <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 p-0">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
            {index > 0 &&
              (separator === 'chevron' ? (
                <Icon name="chevron-droite" size={14} className="shrink-0 text-ink-3" />
              ) : (
                <span aria-hidden="true" className="text-ink-3">
                  /
                </span>
              ))}
            {last || !item.href ? (
              <span aria-current={last ? 'page' : undefined} className={cn('truncate', last ? 'font-semibold text-ink' : 'text-ink-2')}>
                {item.label}
              </span>
            ) : (
              <NextLink href={item.href} className="truncate text-ink-2 hover:text-ink">
                {item.label}
              </NextLink>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
