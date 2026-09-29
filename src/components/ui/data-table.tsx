import * as React from 'react';

import { cn } from '@/utils/cn';

import { EmptyState } from './empty-state';
import { Pagination } from './pagination';
import { LoadingBlock } from './skeleton';
import { Table, Td, Th, Tr } from './table';

export type DataTableColumn<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Libellé court dans la carte mobile (défaut : `header`). */
  mobileLabel?: string;
  className?: string;
  headClassName?: string;
  /** Colonne absente de la carte mobile. */
  hideOnMobile?: boolean;
  /** Colonne d'actions : en-tête lu seulement par le lecteur d'écran, pied de carte en mobile. */
  isAction?: boolean;
};

export type OffsetPagination = {
  /** Total (`count` de LimitOffsetPagination). */
  count: number;
  limit: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
};

type DataTableProps<T> = {
  data: T[] | undefined;
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  /** Titre du tableau pour le lecteur d'écran (`<caption>`). */
  caption?: string;
  emptyState?: React.ReactNode;
  pagination?: OffsetPagination;
};

/**
 * Tableau de données des écrans de gestion (WEB-Design-System, « Table et pagination ») : table
 * encadrée à partir de 768 px, cartes libellé / valeur en dessous, pagination limit/offset.
 */
export function DataTable<T>({
  data,
  columns,
  rowKey,
  isLoading,
  caption,
  emptyState,
  pagination,
}: DataTableProps<T>) {
  if (isLoading) return <LoadingBlock />;
  if (!data || data.length === 0) {
    return (
      <>
        {emptyState ?? (
          <EmptyState title="Aucun élément">
            Rien à afficher pour le moment.
          </EmptyState>
        )}
      </>
    );
  }

  const mobileCols = columns.filter((c) => !c.hideOnMobile && !c.isAction);
  const actionCols = columns.filter((c) => c.isAction);

  return (
    <div className="flex flex-col gap-4">
      <div className="hidden md:block">
        <Table
          framed
          label={caption ? `${caption}, défilement horizontal` : undefined}
        >
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col, i) => (
                <Th key={i} className={col.headClassName}>
                  {col.isAction ? (
                    <span className="sr-only">{col.header}</span>
                  ) : (
                    col.header
                  )}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <Tr key={rowKey(row)}>
                {columns.map((col, i) => (
                  <Td key={i} className={col.className}>
                    {col.cell(row)}
                  </Td>
                ))}
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>

      <ul
        className="m-0 flex list-none flex-col gap-3 p-0 md:hidden"
        aria-label={caption}
      >
        {data.map((row) => (
          <li
            key={rowKey(row)}
            className="rounded-16 border border-line bg-paper p-4"
          >
            <dl className="m-0 flex flex-col gap-1.5">
              {mobileCols.map((col, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-3"
                >
                  <dt className="shrink-0 text-13 text-ink-3">
                    {col.mobileLabel ?? col.header}
                  </dt>
                  <dd className={cn('m-0 min-w-0 text-right text-14 text-ink')}>
                    {col.cell(row)}
                  </dd>
                </div>
              ))}
            </dl>
            {actionCols.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-line pt-3">
                {actionCols.map((col, i) => (
                  <React.Fragment key={i}>{col.cell(row)}</React.Fragment>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {pagination && (
        <Pagination
          offset={pagination.offset}
          limit={pagination.limit}
          total={pagination.count}
          onChange={pagination.onOffsetChange}
        />
      )}
    </div>
  );
}
