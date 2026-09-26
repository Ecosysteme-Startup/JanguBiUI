import { HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import type { DirectoryNode } from '@/features/public-annuaire/api/get-directory';
import { nodeWeekQueryOptions } from '@/features/public-annuaire/api/get-node-week';
import { getParishByCode, parishByCodeQueryOptions } from '@/features/public-annuaire/api/get-parish-by-code';
import { publicAnnouncementsQueryOptions } from '@/features/public-annuaire/api/get-public-announcements';
import { publicEventsQueryOptions } from '@/features/public-annuaire/api/get-public-events';
import { ParishSheet } from '@/features/public-annuaire/components/parish-sheet';
import { nodeAncestorsQueryOptions } from '@/hooks/use-node-ancestors';
import { prefetchPublic } from '@/lib/server-prefetch';

type Props = { params: Promise<{ code: string }> };

type Resolution = { parish: DirectoryNode | null; failed: boolean };

/** Une seule résolution du code par requête (métadonnées et page). */
const resolveParish = cache(async (code: string): Promise<Resolution> => {
  try {
    return { parish: await getParishByCode(code), failed: false };
  } catch {
    return { parish: null, failed: true };
  }
});

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { code } = await params;
  const { parish } = await resolveParish(decodeURIComponent(code));
  if (!parish) return { title: 'Fiche paroisse' };
  const place = [parish.address, parish.city].filter(Boolean).join(', ');
  return {
    title: parish.name,
    description: `${parish.name}${place ? `, ${place}` : ''} : horaires des messes, lieux de culte, annonces et événements.`,
  };
};

/** Fiche publique d'une paroisse (WEB-Fiche-Paroisse). */
const FicheParoissePage = async ({ params }: Props) => {
  const code = decodeURIComponent((await params).code);
  const { parish, failed } = await resolveParish(code);
  if (!parish && !failed) notFound();

  const state = parish
    ? await prefetchPublic(
        { ...parishByCodeQueryOptions(code), queryFn: async () => parish },
        nodeWeekQueryOptions(parish.id),
        nodeAncestorsQueryOptions(parish.id),
        publicAnnouncementsQueryOptions({ nodeId: parish.id, limit: 4 }),
        publicEventsQueryOptions(parish.id, 4),
      )
    : undefined;
  return (
    <HydrationBoundary state={state}>
      <ParishSheet code={code} />
    </HydrationBoundary>
  );
};

export default FicheParoissePage;
