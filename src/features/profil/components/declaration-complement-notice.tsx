'use client';

import { Notice } from '@/components/ui/notice';

import { useDeclaration } from '../api/get-declaration';

import { LIFE_STATE_ANCHOR } from './life-state-section';

/**
 * Rappel en tête du profil quand la chancellerie demande un complément à la déclaration
 * d'état de vie ; la personne complète dans la section « Mon état de vie » (ancre).
 */
export const DeclarationComplementNotice = () => {
  const { data } = useDeclaration();
  if (data?.statut_verification !== 'complement' || data.etat_de_vie === 'laic') return null;
  return (
    <Notice tone="info" icon="document" title="Complément demandé pour votre déclaration" className="mt-8">
      La chancellerie attend un complément à votre déclaration d’état de vie.{' '}
      <a href={`#${LIFE_STATE_ANCHOR}`} className="text-primary underline">
        Compléter ma déclaration
      </a>
    </Notice>
  );
};
