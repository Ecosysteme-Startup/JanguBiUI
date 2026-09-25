import { ParametresScreen } from '@/features/parametres-noeud/components/parametres-screen';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../capability-denied';

type Props = { params: Promise<{ nodeId: string }> };

/**
 * Accès : `horaires.gerer` (spec §2.3) ou `structure.gerer`. L'ENREGISTREMENT exige
 * `structure.gerer` côté serveur (PATCH hierarchy/nodes/{id}/) : sans elle, lecture seule.
 */
const ParametresPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability
      capacite={['horaires.gerer', 'structure.gerer']}
      nodeId={nodeId}
      fallback={<CapabilityDenied nodeId={nodeId} what="Paramètres" capacite="horaires.gerer" />}
    >
      <ParametresScreen nodeId={nodeId} />
    </RequireCapability>
  );
};

export default ParametresPage;
