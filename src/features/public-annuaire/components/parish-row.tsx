import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import type { DirectoryNode } from '../api/get-directory';

import { ParishStatus } from './parish-status';

export const parishPlace = (parish: DirectoryNode) => [parish.address, parish.city].filter(Boolean).join(', ');

/** Ligne de l'annuaire : numéro, nom et adresse, présence sur Jàngu Bi ; lien vers la fiche. */
export const ParishRow = ({
  parish,
  number,
  selected,
  onSelect,
}: {
  parish: DirectoryNode;
  number: number;
  selected: boolean;
  onSelect: () => void;
}) => (
  <li aria-current={selected ? 'true' : undefined}>
    <NextLink
      href={paths.paroisses.detail.getHref(parish.code)}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      className={cn(
        'grid grid-cols-[40px_minmax(0,1fr)_20px] items-center gap-4 border-b border-line py-4 text-ink hover:bg-surface md:grid-cols-[40px_minmax(0,1fr)_140px_20px]',
        selected && 'bg-surface',
      )}
    >
      <span className="tnum text-meta text-ink-3">{String(number).padStart(2, '0')}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-serif text-h4 text-ink">{parish.name}</span>
        {parishPlace(parish) && <span className="truncate text-sm text-ink-2">{parishPlace(parish)}</span>}
        <ParishStatus active={parish.is_active_on_platform} className="md:hidden" />
      </span>
      <ParishStatus active={parish.is_active_on_platform} className="hidden md:inline-flex" />
      <Icon name="chevron-droite" size={18} className="text-ink-3" />
    </NextLink>
  </li>
);
