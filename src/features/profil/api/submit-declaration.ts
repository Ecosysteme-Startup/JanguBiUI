import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { DECLARATION_QUERY_KEY, parseDeclaration } from './get-declaration';

export type DeclarationBody = RequestBody<'v1_me_declaration_create'>;

/**
 * Déclarer ou compléter son état de vie. Repasse en « déclaré » (même après une demande de
 * complément) ; les justificatifs s'ajoutent à ceux déjà joints.
 */
export const submitDeclaration = async (body: DeclarationBody) => parseDeclaration(await api.post('/me/declaration/', body));

export const useSubmitDeclaration = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitDeclaration,
    onSuccess: (declaration) => {
      queryClient.setQueryData(DECLARATION_QUERY_KEY, declaration);
      onSuccess?.();
    },
  });
};
