import type { Metadata } from 'next';

import { FicheCompte } from '@/features/admin-comptes/components/fiche-compte';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export const metadata: Metadata = { title: 'Fiche du compte' };

type Props = { params: Promise<{ id: string }> };

const CompteFichePage = async ({ params }: Props) => {
  const p = await params;
  const id = decodeURIComponent(p.id);
  return (
    <PageComptes
      nodeId={null}
      title="Fiche du compte"
      subtitle="État, fonctions et sécurité"
    >
      <FicheCompte id={id} />
    </PageComptes>
  );
};

export default CompteFichePage;
