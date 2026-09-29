import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type Checkout, checkoutSchema } from '../types/schemas';

export type CheckoutBody = RequestBody<'dons_checkout_create'>;

/**
 * Crée le don et la session de paiement chez l'agrégateur. La clé d'idempotence (une par
 * intention de don) évite un double débit si le fidèle clique deux fois ou si le réseau rejoue.
 */
export const createCheckout = async ({ body, idempotencyKey }: { body: CheckoutBody; idempotencyKey: string }): Promise<Checkout> =>
  checkoutSchema.parse(await api.post('/dons/checkout/', body, { headers: { 'Idempotency-Key': idempotencyKey } }));

export const useCreateCheckout = ({ onSuccess }: { onSuccess?: (checkout: Checkout) => void } = {}) =>
  useMutation({ mutationFn: createCheckout, onSuccess });

/** Clé d'idempotence d'une intention de don (nouvelle à chaque changement du formulaire). */
export const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
