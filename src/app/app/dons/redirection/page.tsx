import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
import { PaymentRedirect } from '@/features/dons/components/donner/payment-redirect';

export const metadata: Metadata = { title: 'Paiement du don', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Redirection vers la page de paiement de l'agrégateur (WEB-FID-Don-Redirection). */
const RedirectionPage = async ({ searchParams }: Props) => {
  const don = (await searchParams).don;
  const donationId = Array.isArray(don) ? don[0] : don;
  if (!donationId) redirect(paths.app.dons.root.getHref());
  return <PaymentRedirect donationId={donationId} variant="fidele" />;
};

export default RedirectionPage;
