'use client';

import { Notice } from '@/components/ui/notice';

import { useDeclaration } from '../api/get-declaration';

/**
 * Demande de complément de la chancellerie sur la déclaration d'état de vie : affichée
 * seulement dans ce cas. Le formulaire de déclaration lui-même (feature
 * `clergy-declaration`) est gelé en V1 : la personne complète via `POST /me/declaration/`.
 */
export const DeclarationComplementNotice = () => {
  const { data } = useDeclaration();
  if (data?.statut_verification !== 'complement') return null;
  return (
    <Notice tone="info" icon="document" title="Complément demandé pour votre déclaration" className="mt-8">
      {data.verification_note || 'La chancellerie demande un complément à votre déclaration d’état de vie.'} Joignez le justificatif demandé
      à votre déclaration, ou prenez contact avec la chancellerie de votre diocèse.
    </Notice>
  );
};
