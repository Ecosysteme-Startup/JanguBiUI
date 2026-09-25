'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import { REQUEST_STATUS } from '@/components/signature/status-dot';
import { paths } from '@/config/paths';

import type { QueueFilters } from '../api/get-queue';
import { DOCUMENT_TYPES } from '../types/processing';

const readFilters = (params: URLSearchParams): QueueFilters => {
  const statut = params.get('statut') ?? '';
  const type = params.get('type') ?? '';
  const page = Number(params.get('page') ?? '1');
  return {
    statut: statut in REQUEST_STATUS ? statut : '',
    type: DOCUMENT_TYPES.some((t) => t.value === type) ? type : '',
    q: params.get('q') ?? '',
    retard: params.get('retard') === '1',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
};

export const filtersToQuery = (f: QueueFilters): string => {
  const params = new URLSearchParams();
  if (f.statut) params.set('statut', f.statut);
  if (f.type) params.set('type', f.type);
  if (f.q.trim()) params.set('q', f.q.trim());
  if (f.retard) params.set('retard', '1');
  if (f.page > 1) params.set('page', String(f.page));
  const query = params.toString();
  return query ? `?${query}` : '';
};

/**
 * Filtres de la file dans l'URL (spec §3 : état partageable). L'état local suit la saisie
 * immédiatement ; l'URL est remplacée sans nouvelle entrée d'historique.
 */
export const useQueueFilters = (nodeId: string) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<QueueFilters>(() => readFilters(new URLSearchParams(searchParams?.toString() ?? '')));

  const update = useCallback(
    (patch: Partial<QueueFilters>) => {
      // Tout changement de filtre ramène à la première page.
      const next = { ...filters, page: 1, ...patch };
      setFilters(next);
      router.replace(`${paths.espace.demandes.list.getHref(nodeId)}${filtersToQuery(next)}`, { scroll: false });
    },
    [filters, router, nodeId],
  );

  return { filters, update };
};
