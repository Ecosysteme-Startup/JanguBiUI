'use client';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';

import { QUEUE_PAGE_SIZE, useQueue } from '../api/get-queue';
import { filtersToQuery, readFilters } from '../hooks/use-queue-filters';

/**
 * Flèches précédent / suivant dans la page de file d'où l'on vient (mêmes filtres, repris de
 * l'URL). Hors de cette page (lien direct, notification), on n'affiche rien plutôt que deviner.
 */
export const QueueNeighbours = ({ nodeId, id }: { nodeId: string; id: string }) => {
  const params = useSearchParams();
  const filters = readFilters(new URLSearchParams(params?.toString() ?? ''));
  const queue = useQueue(nodeId, filters);
  const rows = queue.data?.results ?? [];
  const index = rows.findIndex((r) => r.id === id);
  if (index < 0 || !queue.data) return null;

  const query = filtersToQuery(filters);
  const href = (target: string) => `${paths.espace.demandes.detail.getHref(nodeId, target)}${query}`;
  const previous = rows[index - 1];
  const next = rows[index + 1];
  const position = (filters.page - 1) * QUEUE_PAGE_SIZE + index + 1;

  return (
    <nav aria-label="Demandes voisines dans la file" className="flex items-center gap-2 text-14">
      <span className="tnum mr-1 text-ink-3">
        {position} sur {queue.data.count}
      </span>
      {previous ? (
        <NextLink href={href(previous.id)} aria-label={`Demande précédente : ${previous.reference}`} className="hit inline-flex size-10 items-center justify-center rounded-12 border border-line bg-paper text-ink hover:border-line-field hover:bg-surface">
          <Icon name="chevron-gauche" size={18} />
        </NextLink>
      ) : (
        <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-12 border border-line text-ink-4">
          <Icon name="chevron-gauche" size={18} />
        </span>
      )}
      {next ? (
        <NextLink href={href(next.id)} aria-label={`Demande suivante : ${next.reference}`} className="hit inline-flex size-10 items-center justify-center rounded-12 border border-line bg-paper text-ink hover:border-line-field hover:bg-surface">
          <Icon name="chevron-droite" size={18} />
        </NextLink>
      ) : (
        <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-12 border border-line text-ink-4">
          <Icon name="chevron-droite" size={18} />
        </span>
      )}
    </nav>
  );
};
