import { SundaySheetView } from '@/features/annonces-edition/components/sunday-sheet';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../../capability-denied';

type Props = { params: Promise<{ nodeId: string }>; searchParams: Promise<{ date?: string }> };

const FeuilleAnnoncesPage = async ({ params, searchParams }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  const { date } = await searchParams;
  return (
    <RequireCapability capacite="annonces.publier" nodeId={nodeId} fallback={<CapabilityDenied nodeId={nodeId} what="Annonces" capacite="annonces.publier" />}>
      <SundaySheetView nodeId={nodeId} sunday={typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined} />
    </RequireCapability>
  );
};

export default FeuilleAnnoncesPage;
