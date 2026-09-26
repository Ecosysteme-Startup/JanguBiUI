import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/** Seuls le statut et le motif servent au profil (demande de complément). */
const declarationSchema = z.object({
  statut_verification: z.enum(['declare', 'verifie', 'rejete', 'complement']),
  verification_note: z.string(),
  declared_at: z.string().nullable(),
});
export type Declaration = z.infer<typeof declarationSchema>;

export const getDeclaration = async (): Promise<Declaration> => declarationSchema.parse(await api.get('/me/declaration/'));

export const declarationQueryOptions = () =>
  queryOptions({ queryKey: ['me', 'declaration'], queryFn: getDeclaration, staleTime: 5 * 60 * 1000 });

export const useDeclaration = () => useQuery(declarationQueryOptions());
