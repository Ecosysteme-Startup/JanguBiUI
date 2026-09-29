import type { Metadata } from 'next';

import { PublicGiveScreen } from '@/features/dons/components/donner/public-give-screen';
import { donationPlaceId, donationSource } from '@/features/dons/utils/source';

export const metadata: Metadata = {
  title: 'Faire un don',
  description: 'Soutenir une paroisse : don en ligne affecté au fonds de votre choix, sans compte.',
};

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

/**
 * Don sans compte à une paroisse (WEB-Don-Paroisse) ; `?fonds=` présélectionne un fonds, `?src=`
 * (application, QR code) et `?lieu=` (lieu de culte du QR code) sont relayés au checkout.
 */
const DonParoissePage = async ({ params, searchParams }: Props) => {
  const code = decodeURIComponent((await params).code);
  const query = await searchParams;
  return (
    <PublicGiveScreen
      code={code}
      fundId={first(query.fonds)}
      source={donationSource(first(query.src))}
      placeId={donationPlaceId(first(query.lieu))}
    />
  );
};

export default DonParoissePage;
