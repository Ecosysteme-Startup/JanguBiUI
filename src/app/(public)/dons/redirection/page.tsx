import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
import { PaymentRedirect } from '@/features/dons/components/donner/payment-redirect';

export const metadata: Metadata = { title: 'Paiement du don', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Redirection vers l'agrégateur, parcours sans compte (même écran que WEB-FID-Don-Redirection). */
const RedirectionPubliquePage = async ({ searchParams }: Props) => {
  const don = (await searchParams).don;
  const donationId = Array.isArray(don) ? don[0] : don;
  if (!donationId) redirect(paths.paroisses.list.getHref());
  return (
    <div className="jb-container pb-18 pt-8">
      <PaymentRedirect donationId={donationId} variant="public" />
    </div>
  );
};

export default RedirectionPubliquePage;
