import { HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { diocesesQueryOptions, directoryQueryOptions, doyennesQueryOptions, EXCERPT_PARAMS } from '@/features/public-annuaire/api/get-directory';
import { ParishDirectory } from '@/features/public-annuaire/components/parish-directory';
import { filtersToParams, parseFilters } from '@/features/public-annuaire/utils/filters';
import { prefetchPublic } from '@/lib/server-prefetch';

export const metadata: Metadata = {
  title: 'Trouver une paroisse',
  description: 'Annuaire des paroisses catholiques du Sénégal : adresses, lieux de culte et horaires des messes.',
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Annuaire public des paroisses (WEB-Paroisses) ; filtres dans l'URL. */
const ParoissesPage = async ({ searchParams }: Props) => {
  const filters = parseFilters(await searchParams);
  const state = await prefetchPublic(
    directoryQueryOptions(filtersToParams(filters)),
    directoryQueryOptions(EXCERPT_PARAMS),
    diocesesQueryOptions(),
    ...(filters.diocese ? [doyennesQueryOptions(filters.diocese)] : []),
  );
  return (
    <HydrationBoundary state={state}>
      <ParishDirectory filters={filters} />
    </HydrationBoundary>
  );
};

export default ParoissesPage;
