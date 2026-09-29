'use client';

import { createContext, type ReactNode, useContext } from 'react';

import { paths } from '@/config/paths';

type Chemins = ReturnType<typeof paths.comptes>;

const CheminsComptes = createContext<Chemins>(paths.comptes(null));

/**
 * Racine des écrans « Comptes » : l'espace d'un nœud (`comptes.gerer` d'un curé, du diocèse)
 * ou la plateforme. Le périmètre réel reste décidé par le serveur (`GET /admin/scope/`).
 */
export function CheminsComptesProvider({
  nodeId,
  children,
}: {
  nodeId: string | null;
  children: ReactNode;
}) {
  return (
    <CheminsComptes.Provider value={paths.comptes(nodeId)}>
      {children}
    </CheminsComptes.Provider>
  );
}

export const useCheminsComptes = () => useContext(CheminsComptes);
