import { cn } from '@/utils/cn';

import { Icon } from './icon';

type PaginationProps = {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
  /** Nom des éléments paginés pour la plage (« Demandes 1 à 6 sur 17 ») ; sinon « 1–10 sur 17 ». */
  noun?: string;
  /** Place du nom : `before` (« Demandes 1 à 6 sur 17 », défaut) ou `after` (« 1 à 12 sur 17 demandes »). */
  nounPosition?: 'before' | 'after';
  /** Précédent / Suivant réduits à leur chevron (table de PAR-Demandes). */
  compact?: boolean;
  className?: string;
};

const pageClass = 'hit inline-flex h-9 min-w-9 items-center justify-center rounded-10 px-1.5 tnum text-14';

/**
 * Pagination limit/offset (WEB-Design-System) : cases 36 px rayon 10, page courante b50/b800 avec
 * filet b200, « Précédent » discret et « Suivant » en contour.
 */
export const Pagination = ({ offset, limit, total, onChange, noun, nounPosition = 'before', compact = false, className }: PaginationProps) => {
  if (total <= limit) return null;
  const pages = Math.ceil(total / limit);
  const current = Math.floor(offset / limit);
  const first = offset + 1;
  const last = Math.min(offset + limit, total);
  const visiblePages = Array.from({ length: pages }, (_, i) => i).filter((i) => Math.abs(i - current) <= 2 || i === 0 || i === pages - 1);
  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <span className="tnum text-14 text-ink-2">{noun ? (nounPosition === 'after' ? `${first} à ${last} sur ${total} ${noun}` : `${noun} ${first} à ${last} sur ${total}`) : `${first}–${last} sur ${total}`}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Page précédente"
          disabled={current === 0}
          onClick={() => onChange((current - 1) * limit)}
          className={cn(
            'hit inline-flex h-9 items-center gap-1 rounded-10 text-14 font-medium text-ink-2 hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-ink-4 disabled:hover:bg-transparent',
            compact ? 'w-9 justify-center' : 'pl-2 pr-3',
          )}
        >
          <Icon name="chevron-gauche" size={16} />
          {!compact && 'Précédent'}
        </button>
        {visiblePages.map((page, index) => (
          <span key={page} className="flex items-center gap-1">
            {index > 0 && page - visiblePages[index - 1] > 1 && <span className="px-1 text-ink-3">…</span>}
            <button
              type="button"
              aria-current={page === current ? 'page' : undefined}
              aria-label={`Page ${page + 1}`}
              onClick={() => onChange(page * limit)}
              className={cn(
                pageClass,
                page === current ? 'border border-line-active bg-tint-50 font-semibold text-tint-800' : 'font-medium text-ink-2 hover:bg-surface-2',
              )}
            >
              {page + 1}
            </button>
          </span>
        ))}
        <button
          type="button"
          aria-label="Page suivante"
          disabled={current >= pages - 1}
          onClick={() => onChange((current + 1) * limit)}
          className={cn(
            'hit inline-flex h-9 items-center gap-1 rounded-10 border border-line text-14 font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:text-ink-4',
            compact ? 'w-9 justify-center' : 'pl-3 pr-2',
          )}
        >
          {!compact && 'Suivant'}
          <Icon name="chevron-droite" size={16} />
        </button>
      </div>
    </nav>
  );
};
