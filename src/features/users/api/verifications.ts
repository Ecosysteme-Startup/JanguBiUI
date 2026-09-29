import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Vérification des statuts cléricaux et consacrés déclarés :
// `/v1/hierarchy/verifications/` (capacité `personnes.verifier`, MFA).

const noeudRef = z
  .object({ id: z.string(), name: z.string(), code: z.string(), type: z.string() })
  .nullable();

export const declarationSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  etat_de_vie: z.string(),
  degre_ordre: z.string(),
  statut_verification: z.string(),
  verification_note: z.string().default(''),
  declared_at: z.string().nullable(),
  incardination_node: noeudRef,
  institut_node: noeudRef,
  attachments: z
    .array(
      z.object({
        id: z.number(),
        file_name: z.string(),
        file_type: z.string(),
        url: z.string().nullable(),
        created_at: z.string(),
      }),
    )
    .default([]),
});
export type Declaration = z.infer<typeof declarationSchema>;

export const LIBELLES_ETAT: Record<string, string> = {
  laic: 'Laïc',
  clerc: 'Clerc',
  consacre: 'Consacré(e)',
};

export const LIBELLES_ORDRE: Record<string, string> = {
  aucun: '',
  diacre_transitoire: 'Diacre (transitoire)',
  diacre_permanent: 'Diacre permanent',
  pretre: 'Prêtre',
  eveque: 'Évêque',
};

export const DECLARATIONS_PAR_PAGE = 20;

export const useDeclarations = (
  statut: 'declare' | 'complement',
  offset: number,
) =>
  useQuery({
    queryKey: ['verifications', statut, offset],
    queryFn: async () =>
      z
        .object({ count: z.number(), results: z.array(declarationSchema) })
        .parse(
          await api.get<unknown>('/v1/hierarchy/verifications/', {
            params: { statut, limit: DECLARATIONS_PAR_PAGE, offset },
            quiet: true,
          }),
        ),
    placeholderData: keepPreviousData,
  });

export type Decision = 'verifie' | 'rejete' | 'complement';

export const useDecider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      personId,
      decision,
      note = '',
    }: {
      personId: string;
      decision: Decision;
      note?: string;
    }) =>
      declarationSchema.parse(
        await api.post<unknown>(
          `/v1/hierarchy/verifications/${personId}/decision/`,
          { decision, note },
        ),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verifications'] }),
  });
};
