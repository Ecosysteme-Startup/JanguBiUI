import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

export const ASSIGNMENT_STATUSES = ['active', 'proposee', 'terminee', 'annulee'] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const assignmentSchema = z.object({
  id: z.number(),
  person: z.object({ id: z.string(), email: z.string(), full_name: z.string() }),
  office: z.string(),
  office_label: z.string(),
  node: z.object({ id: z.string(), name: z.string(), code: z.string(), type: z.string() }),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  status: z.enum(ASSIGNMENT_STATUSES).optional(),
  appointed_by_id: z.string().nullable(),
  decree_ref: z.string().optional(),
  note: z.string().optional(),
  created_at: z.string().optional(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

type _AssignmentMatchesContract = Expect<Matches<Assignment, ResponseBody<'v1_hierarchy_assignments_retrieve'>>>;

const pageSchema = z.object({ count: z.number(), results: z.array(assignmentSchema) });
export type AssignmentPage = z.infer<typeof pageSchema>;

export type AssignmentFilters = { node: string; status?: AssignmentStatus; office?: string; offset?: number };
export const ASSIGNMENTS_PAGE = 10;

export const getAssignments = async (
  { node, status, office, offset = 0 }: AssignmentFilters,
  limit = ASSIGNMENTS_PAGE,
): Promise<AssignmentPage> =>
  pageSchema.parse(await api.get('/hierarchy/assignments/', { params: { node, status, office, limit, offset } }));

/** Registre des nominations du sous-arbre (offices.nommer). */
export const useAssignments = (filters: AssignmentFilters) =>
  useQuery({ queryKey: ['nominations', 'list', filters], queryFn: () => getAssignments(filters), placeholderData: keepPreviousData });

/** Nombre de nominations par statut (compteurs des filtres). */
export const useAssignmentCounts = (node: string, office?: string) =>
  useQueries({
    queries: ASSIGNMENT_STATUSES.map((status) => ({
      queryKey: ['nominations', 'count', node, office, status],
      queryFn: async () => (await getAssignments({ node, office, status }, 1)).count,
    })),
    combine: (results) =>
      Object.fromEntries(ASSIGNMENT_STATUSES.map((s, i) => [s, results[i]?.data])) as Record<AssignmentStatus, number | undefined>,
  });
