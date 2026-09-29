import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Équipe des compteurs de quête (compléments V1 §2.2, repris de main) : capacité
// `dons.saisir_quete` sur la paroisse. La saisie garde des noms libres : l'équipe ne
// sert qu'à proposer les noms habituels.

export const compteurSchema = z.object({
  id: z.number(),
  nom: z.string(),
  actif: z.boolean(),
  ajoute_le: z.string().nullish(),
});
export type Compteur = z.infer<typeof compteurSchema>;

const equipeSchema = z.object({
  compteurs: z.array(compteurSchema),
  noms_recents: z.array(z.string()).default([]),
});
export type EquipeCompteurs = z.infer<typeof equipeSchema>;

const compteursKey = (nodeId: string) => ['dons', 'compteurs', nodeId] as const;

export const useEquipeCompteurs = (nodeId: string) =>
  useQuery({
    queryKey: compteursKey(nodeId),
    queryFn: async () =>
      equipeSchema.parse(
        await api.get('/staff/dons/compteurs/', { params: { node: nodeId } }),
      ),
  });

/** Noms proposés à la saisie d'une quête : l'équipe active, puis les noms récents. */
export const nomsProposes = (data: EquipeCompteurs | undefined): string[] => [
  ...new Set([
    ...(data?.compteurs ?? []).filter((c) => c.actif).map((c) => c.nom),
    ...(data?.noms_recents ?? []),
  ]),
];

export const useAjouterCompteur = (nodeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nom: string) =>
      compteurSchema.parse(
        await api.post('/staff/dons/compteurs/', { node: nodeId, nom }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: compteursKey(nodeId) }),
  });
};

export const useRenommerCompteur = (nodeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nom }: { id: number; nom: string }) =>
      compteurSchema.parse(
        await api.patch(`/staff/dons/compteurs/${id}/`, { nom }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: compteursKey(nodeId) }),
  });
};

export const useRetirerCompteur = (nodeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.delete<null>(`/staff/dons/compteurs/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: compteursKey(nodeId) }),
  });
};
