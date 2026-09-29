import type { Metadata } from 'next';

import { GiveScreen } from '@/features/dons/components/donner/give-screen';

export const metadata: Metadata = { title: 'Faire un don', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

/** Faire un don à la paroisse suivie (WEB-FID-Donner) ; `?fonds=` présélectionne un fonds. */
const DonnerPage = async ({ searchParams }: Props) => <GiveScreen fundId={first((await searchParams).fonds)} />;

export default DonnerPage;
