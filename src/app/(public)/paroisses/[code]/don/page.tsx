import type { Metadata } from 'next';

import { PublicGiveScreen } from '@/features/dons/components/donner/public-give-screen';

export const metadata: Metadata = {
  title: 'Faire un don',
  description: 'Soutenir une paroisse : don en ligne affecté au fonds de votre choix, sans compte.',
};

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Don sans compte à une paroisse (WEB-Don-Paroisse) ; `?fonds=` présélectionne un fonds. */
const DonParoissePage = async ({ params, searchParams }: Props) => {
  const code = decodeURIComponent((await params).code);
  const fonds = (await searchParams).fonds;
  return <PublicGiveScreen code={code} fundId={(Array.isArray(fonds) ? fonds[0] : fonds) ?? null} />;
};

export default DonParoissePage;
