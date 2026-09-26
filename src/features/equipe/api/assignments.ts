import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, RequestBody, ResponseBody } from '@/types/api-contract';

export const assignmentSchema = z.object({
  id: z.number(),
  person: z.object({ id: z.string(), email: z.string(), full_name: z.string() }),
  office: z.string(),
  /** Titre du titulaire : « Curé », « Administrateur paroissial », « Vicaire paroissial »… */
  office_label: z.string(),
  quality: z.string().default(''),
  node: z.object({ id: z.string(), name: z.string(), code: z.string(), type: z.string() }),
  start_date: z.string(),
  end_date: z.string().nullable(),
  status: z.enum(['proposee', 'active', 'terminee', 'annulee']),
  appointed_by_id: z.string().nullable(),
  decree_ref: z.string(),
  note: z.string(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

type _AssignmentKeys = Expect<Matches<Exclude<keyof Assignment, keyof ResponseBody<'v1_hierarchy_assignments_retrieve'>>, never>>;

const pageSchema = z.object({ count: z.number(), results: z.array(assignmentSchema) });
const assignmentsKey = ['hierarchy', 'assignments'] as const;

/**
 * Nominations du nœud et de son sous-arbre : celles des nœuds où l'on a `offices.nommer`,
 * en lecture celles où l'on a `tableau_bord.voir`, plus les siennes (plafond : 50 par page).
 */
export const getNodeAssignments = async (nodeId: string) =>
  pageSchema.parse(await api.get('/hierarchy/assignments/', { params: { node: nodeId, limit: 50 } }));

export const nodeAssignmentsQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: [...assignmentsKey, { node: nodeId }], queryFn: () => getNodeAssignments(nodeId) });

export const useNodeAssignments = (nodeId: string) => useQuery(nodeAssignmentsQueryOptions(nodeId));

export type AssignmentCreateBody = RequestBody<'v1_hierarchy_assignments_create'>;
type AssignmentUpdateBody = RequestBody<'v1_hierarchy_assignments_partial_update'>;

export const createAssignment = async (body: AssignmentCreateBody) => assignmentSchema.parse(await api.post('/hierarchy/assignments/', body));

export const endAssignment = async (id: number, endDate: string) => {
  const body: AssignmentUpdateBody = { action: 'terminer', end_date: endDate };
  return assignmentSchema.parse(await api.patch(`/hierarchy/assignments/${id}/`, body));
};

export const setAssignmentQuality = async (id: number, quality: string) => {
  const body: AssignmentUpdateBody = { action: 'qualifier', quality };
  return assignmentSchema.parse(await api.patch(`/hierarchy/assignments/${id}/`, body));
};

/** Change la qualité d'une nomination ; les droits en cache de la personne changent de titre si c'est moi. */
export const useSetAssignmentQuality = ({ meId, onSuccess }: { meId?: string; onSuccess?: (a: Assignment) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quality }: { id: number; quality: string }) => setAssignmentQuality(id, quality),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: assignmentsKey }),
        updated.person.id === meId ? queryClient.invalidateQueries({ queryKey: ['me', 'capacites'] }) : undefined,
      ]);
      onSuccess?.(updated);
    },
  });
};

export const useCreateAssignment = ({ onSuccess }: { onSuccess?: (a: Assignment) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssignment,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: assignmentsKey });
      onSuccess?.(created);
    },
  });
};

export const useEndAssignment = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, endDate }: { id: number; endDate: string }) => endAssignment(id, endDate),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: assignmentsKey });
      onSuccess?.();
    },
  });
};
