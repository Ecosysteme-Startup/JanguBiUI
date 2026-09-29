import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const consentStatusSchema = z.object({
  current_version: z.string(),
  given_version: z.string(),
  given_at: z.string().nullable(),
  required: z.boolean(),
});
export type ConsentStatus = z.infer<typeof consentStatusSchema>;

export const getConsent = async (): Promise<ConsentStatus> => consentStatusSchema.parse(await api.get('/me/consent/'));

export const consentQueryOptions = () => queryOptions({ queryKey: ['me', 'consent'], queryFn: getConsent });

export const useConsent = () => useQuery(consentQueryOptions());
