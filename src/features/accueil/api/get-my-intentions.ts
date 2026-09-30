import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Doublon assumé de la feature `intentions` (`GET /mass-intentions/mine/`, API-V1-COMPLEMENTS §4) :
// l'accueil n'affiche que les trois dernières demandes. Le champ `notice` (offrande) est
// volontairement ignoré : jamais d'appel au don ni de paiement lié aux intentions sur l'accueil.

const intentionSchema = z.object({
  id: z.string(),
  parish: z.object({ id: z.string(), name: z.string() }),
  kind: z.string(),
  intention: z.string(),
  is_anonymous: z.boolean(),
  requested_date: z.string().nullish(),
  requested_mass: z.string().default(''),
  status: z.string(),
  scheduled_date: z.string().nullish(),
  scheduled_mass: z.string().default(''),
  celebrated_at: z.string().nullish(),
  created_at: z.string(),
});
export type HomeIntention = z.infer<typeof intentionSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(intentionSchema) });

export const HOME_INTENTIONS = 3;

/** Mes dernières intentions de messe, les plus récentes d'abord (ordre du serveur). */
export const getMyIntentions = async () =>
  pageSchema.parse(await api.get('/mass-intentions/mine/', { params: { limit: HOME_INTENTIONS } }));

// Même préfixe de clé que la feature `intentions` : une demande ou une annulation l'invalide aussi.
export const myIntentionsQueryOptions = () =>
  queryOptions({ queryKey: ['mass-intentions', 'mine', 'accueil'], queryFn: getMyIntentions });

export const useMyIntentions = () => useQuery(myIntentionsQueryOptions());
