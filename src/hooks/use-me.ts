import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const nodeRefSchema = z.object({ id: z.string(), name: z.string(), code: z.string(), type: z.string() });

const meSchema = z.object({
  id: z.string(),
  email: z.string(),
  profile: z.record(z.string(), z.unknown()),
  paroisse_suivie: nodeRefSchema.nullable(),
  consent: z.record(z.string(), z.unknown()),
});
export type Me = z.infer<typeof meSchema>;

export const getMe = async (): Promise<Me> => meSchema.parse(await api.get('/me/'));

export const meQueryOptions = () => queryOptions({ queryKey: ['me'], queryFn: getMe, staleTime: 5 * 60 * 1000 });

export const useMe = () => useQuery(meQueryOptions());

/** Prénom et nom affichables, à partir du profil (champs libres côté backend). */
export const displayName = (me: Me | undefined): { first: string; full: string } => {
  const first = typeof me?.profile.first_name === 'string' ? me.profile.first_name : '';
  const last = typeof me?.profile.last_name === 'string' ? me.profile.last_name : '';
  const full = [first, last].filter(Boolean).join(' ') || me?.email || '';
  return { first: first || full, full };
};
