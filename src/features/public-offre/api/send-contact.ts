import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

export const FONCTIONS = [
  { value: 'cure', label: 'Curé' },
  { value: 'vicaire', label: 'Vicaire' },
  { value: 'secretaire', label: 'Secrétaire paroissiale' },
  { value: 'referent_numerique', label: 'Référent numérique' },
  { value: 'chancelier', label: 'Chancelier' },
  { value: 'eveque', label: 'Évêque ou délégué épiscopal' },
  { value: 'autre', label: 'Autre' },
] as const;

export type Fonction = (typeof FONCTIONS)[number]['value'];

/** Corps de `POST /public/contact/`, dérivé du contrat. Réponse 201 `{ received: true }` ; 400 `{ champ: [messages] }`. */
export type ContactBody = RequestBody<'public_contact_create'>;

const responseSchema = z.object({ received: z.literal(true) });

export const sendContact = async (body: ContactBody) => responseSchema.parse(await api.post('/public/contact/', body));

export const useSendContact = () => useMutation({ mutationFn: sendContact });
