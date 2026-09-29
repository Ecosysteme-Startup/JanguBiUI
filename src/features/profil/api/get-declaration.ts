import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const ETATS_DE_VIE = ['laic', 'clerc', 'consacre'] as const;
export const DEGRES_ORDRE = ['aucun', 'diacre_transitoire', 'diacre_permanent', 'pretre', 'eveque'] as const;
export type EtatDeVie = (typeof ETATS_DE_VIE)[number];
export type DegreOrdre = (typeof DEGRES_ORDRE)[number];

const nodeRefSchema = z.object({ id: z.string(), name: z.string(), code: z.string(), type: z.string() });
export type NodeRef = z.infer<typeof nodeRefSchema>;

const attachmentSchema = z.object({
  id: z.number(),
  file_name: z.string(),
  file_type: z.string(),
  url: z.string().nullable(),
  created_at: z.string(),
});
export type DeclarationAttachment = z.infer<typeof attachmentSchema>;

/** État de vie déclaré (GET /me/declaration/) : n'ouvre aucun droit tant qu'il n'est pas vérifié. */
const declarationSchema = z.object({
  etat_de_vie: z.enum(ETATS_DE_VIE),
  degre_ordre: z.enum(DEGRES_ORDRE),
  statut_verification: z.enum(['declare', 'verifie', 'rejete', 'complement']),
  verification_note: z.string(),
  declared_at: z.string().nullable(),
  incardination_node: nodeRefSchema.nullable(),
  institut_node: nodeRefSchema.nullable(),
  attachments: z.array(attachmentSchema),
});
export type Declaration = z.infer<typeof declarationSchema>;

export const parseDeclaration = (data: unknown): Declaration => declarationSchema.parse(data);

export const getDeclaration = async (): Promise<Declaration> => parseDeclaration(await api.get('/me/declaration/'));

export const DECLARATION_QUERY_KEY = ['me', 'declaration'] as const;

export const declarationQueryOptions = () =>
  queryOptions({ queryKey: DECLARATION_QUERY_KEY, queryFn: getDeclaration, staleTime: 5 * 60 * 1000 });

export const useDeclaration = () => useQuery(declarationQueryOptions());
