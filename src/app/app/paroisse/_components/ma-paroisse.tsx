'use client';

import { paths } from '@/config/paths';
import { SupportParishCard } from '@/features/dons/components/soutenir/support-parish-card';
import { ParishOverview } from '@/features/paroisse/components/parish-overview';

/** Ma paroisse + bloc « Soutenir la paroisse » (feature dons) en fin de colonne droite. */
export const MaParoisse = () => (
  <ParishOverview renderAsideExtra={(nodeId) => <SupportParishCard nodeId={nodeId} href={paths.app.dons.root.getHref()} />} />
);
