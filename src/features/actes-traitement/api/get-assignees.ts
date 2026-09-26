import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { type Assignee, assigneeSchema } from '../types/processing';

/** Équipe de la paroisse à qui confier la demande (titulaires d'actes.traiter sur le nœud). */
export const getAssignees = async (id: string): Promise<Assignee[]> =>
  z.array(assigneeSchema).parse(await api.get(`/staff/documents/${encodeURIComponent(id)}/assignees/`));

export const assigneesQueryOptions = (nodeId: string, id: string) =>
  queryOptions({ queryKey: ['demandes', nodeId, 'assignees', id], queryFn: () => getAssignees(id), staleTime: 5 * 60_000 });

export const useAssignees = (nodeId: string, id: string) => useQuery(assigneesQueryOptions(nodeId, id));
