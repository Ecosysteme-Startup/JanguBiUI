import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type RequesterRequest, requesterRequestSchema } from '../types';

export type CreateDocumentInput = {
  /** Paroisse où le sacrement a été célébré (UUID du nœud, RG-02). */
  target_node_id: string;
  document_type: string;
  document_type_free?: string;
  reason: string;
  reason_free?: string;
  // Identité
  requester_last_name: string;
  requester_first_names: string;
  date_of_birth: string;
  place_of_birth: string;
  // Contact
  contact_phone: string;
  contact_email: string;
  // Recherche
  registered_last_name?: string;
  registered_first_names?: string;
  father_last_name: string;
  mother_last_name: string;
  sacrament_approximate_date: string;
  sacrament_location: string;
  additional_info?: string;
  document_details?: Record<string, string>;
  pickup_mode?: 'secretariat' | 'transfer_to_followed_parish';
  consent_given: boolean;
  attachment_file_id?: number | null;
};

export const createDocumentRequest = (
  data: CreateDocumentInput,
): Promise<RequesterRequest> =>
  api
    .post<unknown>('/v1/documents/requests/', data, { quiet: true })
    .then((res) => requesterRequestSchema.parse(res));

export const useCreateDocument = ({
  onSuccess,
}: { onSuccess?: (created: RequesterRequest) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDocumentRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'requests'],
      });
      onSuccess?.(created);
    },
  });
};
