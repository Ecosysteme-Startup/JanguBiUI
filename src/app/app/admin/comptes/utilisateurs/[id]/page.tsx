'use client';

import { useParams } from 'next/navigation';

import { FicheCompte } from '@/features/admin-comptes/components/fiche-compte';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export default function AdminCompteFichePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <PageComptes title="Fiche du compte" subtitle="État, fonctions et sécurité">
      <FicheCompte id={id} />
    </PageComptes>
  );
}
