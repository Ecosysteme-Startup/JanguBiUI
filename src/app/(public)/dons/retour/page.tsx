import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
import { DonationConfirmation } from '@/features/dons/components/donner/donation-confirmation';
import { auth } from '@/lib/auth';

export const metadata: Metadata = { title: 'Suivi du don', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * Retour de l'agrégateur (DONATIONS_RETURN_URL du backend) : `?don=<id>`, et `&annule=1` quand le
 * donateur annule chez l'opérateur. Connecté : reçu et « Voir mes dons ».
 */
const RetourDonPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const donationId = first(params.don);
  if (!donationId) redirect(paths.paroisses.list.getHref());
  const session = await auth();
  const signedIn = Boolean(session?.accessToken && !session.error);
  return (
    <div className="jb-container pb-18 pt-8">
      <DonationConfirmation donationId={donationId} variant="public" signedIn={signedIn} cancelled={first(params.annule) === '1'} />
    </div>
  );
};

export default RetourDonPage;
