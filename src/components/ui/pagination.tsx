import { cn } from '@/utils/cn';

import { Icon } from './icon';

type PaginationProps = {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
  className?: string;
};

/** Pagination limit/offset (contrat de l'API) : « 1–10 sur 17 » et pages. */
export const Pagination = ({ offset, limit, total, onChange, className }: PaginationProps) => {
  if (total <= limit) return null;
  const pages = Math.ceil(total / limit);
  const current = Math.floor(offset / limit);
  const first = offset + 1;
  const last = Math.min(offset + limit, total);
  const window = Array.from({ length: pages }, (_, i) => i).filter((i) => Math.abs(i - current) <= 2 || i === 0 || i === pages - 1);
  const square = 'inline-flex size-9 items-center justify-center rounded tnum text-xs';
  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-between border-t border-line pt-3', className)}>
      <span className="tnum text-meta text-ink-3">
        {first}–{last} sur {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Page précédente"
          disabled={current === 0}
          onClick={() => onChange((current - 1) * limit)}
          className={cn(square, 'border border-line text-ink hover:bg-surface-2 disabled:text-ink-3')}
        >
          <Icon name="chevron-gauche" size={18} />
        </button>
        {window.map((page, index) => (
          <span key={page} className="flex items-center gap-1">
            {index > 0 && page - window[index - 1] > 1 && <span className="px-1 text-ink-3">…</span>}
            <button
              type="button"
              aria-current={page === current ? 'page' : undefined}
              aria-label={`Page ${page + 1}`}
              onClick={() => onChange(page * limit)}
              className={cn(square, page === current ? 'bg-ink text-paper' : 'text-ink hover:bg-surface-2')}
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
          className={cn(square, 'border border-line text-ink hover:bg-surface-2 disabled:text-ink-3')}
        >
          <Icon name="chevron-droite" size={18} />
        </button>
      </div>
    </nav>
  );
};
