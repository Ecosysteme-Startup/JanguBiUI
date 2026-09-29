import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
import { DonationConfirmation } from '@/features/dons/components/donner/donation-confirmation';

export const metadata: Metadata = { title: 'Suivi du don', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Retour de paiement dans l'espace fidèle (WEB-FID-Don-Confirmation) ; `?annule=1` : annulé chez l'agrégateur. */
const ConfirmationPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const donationId = first(params.don);
  if (!donationId) redirect(paths.app.dons.root.getHref());
  return <DonationConfirmation donationId={donationId} variant="fidele" signedIn cancelled={first(params.annule) === '1'} />;
};

export default ConfirmationPage;
