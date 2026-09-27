import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/** Catalogue fermé des capacités (backend, migrations 0004 et 0009 — RG-14, ADR-017). */
export const CAPACITES = [
  'structure.gerer',
  'horaires.gerer',
  'offices.nommer',
  'personnes.verifier',
  'annonces.publier',
  'evenements.gerer',
  'actes.traiter',
  'actes.superviser',
  'messagerie.recevoir_fideles',
  'confessions.gerer',
  'confessions.voir_planning',
  'tableau_bord.voir',
  'audit.voir',
  'dons.voir_fonds',
  'dons.gerer_fonds',
  'dons.saisir_quete',
  'dons.voir_donateurs',
  'dons.exporter',
  'dons.definir_quete_imperee',
  'plateforme.admin',
] as const;
export type Capacite = (typeof CAPACITES)[number];

const grantSchema = z.object({
  capacite: z.string(),
  node_id: z.string().nullable(),
  node_name: z.string(),
  node_type: z.string().default(''),
  herite: z.boolean(),
  office: z.string(),
  /** Titre de la nomination qui accorde la capacité : « Curé », « Administrateur paroissial »… */
  office_label: z.string().default(''),
});
export type Grant = z.infer<typeof grantSchema>;

export const getCapacites = async (): Promise<Grant[]> => z.array(grantSchema).parse(await api.get('/me/capacites/'));

export const capacitesQueryOptions = () =>
  queryOptions({ queryKey: ['me', 'capacites'], queryFn: getCapacites, staleTime: 5 * 60 * 1000 });

export const useCapacites = () => useQuery(capacitesQueryOptions());
