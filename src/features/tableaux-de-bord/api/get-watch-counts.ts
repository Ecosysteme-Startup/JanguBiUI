import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/** Compteurs « à surveiller » du diocèse : un total, jamais la liste des personnes. */
const countSchema = z.object({ count: z.number() });

const countOf = async (path: string, params: Record<string, string> = {}) =>
  countSchema.parse(await api.get(path, { params: { ...params, limit: 1 } })).count;

/** Déclarations d'état de vie en attente (personnes.verifier). */
export const usePendingVerifications = (enabled: boolean) =>
  useQuery({ queryKey: ['dashboards', 'verifications-count'], queryFn: () => countOf('/hierarchy/verifications/'), enabled });

/** Nominations proposées dans le sous-arbre (offices.nommer). */
export const useProposedAssignments = (nodeId: string, enabled: boolean) =>
  useQuery({
    queryKey: ['dashboards', 'proposed-count', nodeId],
    queryFn: () => countOf('/hierarchy/assignments/', { node: nodeId, status: 'proposee' }),
    enabled,
  });
