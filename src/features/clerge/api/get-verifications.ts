import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

const nodeRefSchema = z.object({ id: z.string(), name: z.string(), code: z.string(), type: z.string() });

const attachmentSchema = z.object({
  id: z.number(),
  file_name: z.string(),
  file_type: z.string(),
  url: z.string().nullable(),
  created_at: z.string(),
});
export type DeclarationAttachment = z.infer<typeof attachmentSchema>;

export const VERIFICATION_STATUSES = ['declare', 'verifie', 'rejete', 'complement'] as const;

export const personStatusSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  etat_de_vie: z.string(),
  degre_ordre: z.string(),
  statut_verification: z.enum(VERIFICATION_STATUSES),
  verification_note: z.string(),
  declared_at: z.string().nullable(),
  incardination_node: nodeRefSchema.nullable(),
  institut_node: nodeRefSchema.nullable(),
  attachments: z.array(attachmentSchema),
});
export type PersonStatus = z.infer<typeof personStatusSchema>;

type _PersonStatusMatchesContract = Expect<Matches<PersonStatus, ResponseBody<'v1_hierarchy_verifications_decision_create'>>>;

const pageSchema = z.object({ count: z.number(), results: z.array(personStatusSchema) });

export const VERIFICATIONS_PAGE = 20;

export const ETAT_DE_VIE: Record<string, string> = { laic: 'Laïc', clerc: 'Clerc', consacre: 'Consacré' };
export const DEGRE_ORDRE: Record<string, string> = {
  aucun: 'Aucun ordre',
  diacre_transitoire: 'Diacre (transitoire)',
  diacre_permanent: 'Diacre permanent',
  pretre: 'Prêtre',
  eveque: 'Évêque',
};

/** Déclarations d'état de vie à vérifier ou en attente de complément, dans mon périmètre (personnes.verifier). */
export const getVerifications = async (offset: number) =>
  pageSchema.parse(await api.get('/hierarchy/verifications/', { params: { limit: VERIFICATIONS_PAGE, offset } }));

export const useVerifications = (offset: number) =>
  useQuery({ queryKey: ['clerge', 'verifications', offset], queryFn: () => getVerifications(offset), placeholderData: keepPreviousData });
